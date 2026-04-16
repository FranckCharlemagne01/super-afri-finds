import { useEffect, useState, useCallback } from 'react';

interface NativeAppState {
  isNative: boolean;
  isOnline: boolean;
  platform: 'web' | 'ios' | 'android';
}

/**
 * Hook central pour toutes les fonctionnalités natives Capacitor.
 * Safe pour le web : les imports sont dynamiques et conditionnels.
 */
export const useNativeApp = () => {
  const [state, setState] = useState<NativeAppState>({
    isNative: false,
    isOnline: navigator.onLine,
    platform: 'web'
  });

  // ─── Initialisation ───
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform() || cancelled) return;

        const platform = Capacitor.getPlatform() as 'ios' | 'android';

        // Status bar
        try {
          const { StatusBar, Style } = await import('@capacitor/status-bar');
          await StatusBar.setStyle({ style: Style.Light });
          if (platform === 'android') {
            await StatusBar.setBackgroundColor({ color: '#0b0f19' });
          }
        } catch {}

        // Splash screen
        try {
          const { SplashScreen } = await import('@capacitor/splash-screen');
          await SplashScreen.hide({ fadeOutDuration: 500 });
        } catch {}

        // Network
        let connected = true;
        try {
          const { Network } = await import('@capacitor/network');
          const status = await Network.getStatus();
          connected = status.connected;
        } catch {}

        if (!cancelled) {
          setState({ isNative: true, isOnline: connected, platform });
        }
      } catch {}
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // ─── Network listener ───
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const setup = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        const { Network } = await import('@capacitor/network');
        const handler = await Network.addListener('networkStatusChange', (s) => {
          setState(prev => ({ ...prev, isOnline: s.connected }));
        });
        cleanup = () => handler.remove();
      } catch {}
    };
    setup();
    return () => cleanup?.();
  }, []);

  // ─── Back button Android + Deep links ───
  useEffect(() => {
    let cleanups: (() => void)[] = [];
    const setup = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        const { App } = await import('@capacitor/app');

        // Deep links : redirige vers le bon chemin interne
        const urlH = await App.addListener('appUrlOpen', (e) => {
          if (e.url) {
            try {
              const path = new URL(e.url).pathname;
              if (path && path !== '/') {
                window.location.href = path;
              }
            } catch {}
          }
        });
        cleanups.push(() => urlH.remove());

        // Bouton retour Android
        const backH = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            App.minimizeApp();
          }
        });
        cleanups.push(() => backH.remove());
      } catch {}
    };
    setup();
    return () => cleanups.forEach(fn => fn());
  }, []);

  // ─── Web fallback pour online/offline ───
  useEffect(() => {
    const onOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const onOffline = () => setState(prev => ({ ...prev, isOnline: false }));
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // ─── Actions ───

  const vibrate = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
      await Haptics.impact({ style: map[style] });
    } catch {}
  }, []);

  const shareContent = useCallback(async (opts: { title: string; text?: string; url?: string }) => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) {
        // Fallback Web Share API
        if (navigator.share) await navigator.share(opts);
        return;
      }
      const { Share } = await import('@capacitor/share');
      await Share.share(opts);
    } catch {}
  }, []);

  const showSplash = useCallback(async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.show({ showDuration: 2000, autoHide: true, fadeInDuration: 300, fadeOutDuration: 500 });
    } catch {}
  }, []);

  const hideSplash = useCallback(async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide({ fadeOutDuration: 500 });
    } catch {}
  }, []);

  return { ...state, vibrate, shareContent, showSplash, hideSplash };
};
