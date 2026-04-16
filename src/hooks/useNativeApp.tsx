import { useEffect, useState, useCallback } from 'react';

interface NativeAppState {
  isNative: boolean;
  isOnline: boolean;
  platform: string;
}

/**
 * Hook pour gérer les fonctionnalités natives iOS/Android via Capacitor.
 * Safe pour le web — charge Capacitor uniquement en contexte natif.
 */
export const useNativeApp = () => {
  const [state, setState] = useState<NativeAppState>({
    isNative: false,
    isOnline: true,
    platform: 'web'
  });

  const initializeNative = useCallback(async () => {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    try {
      const platform = Capacitor.getPlatform();

      // Status bar
      if (platform === 'ios' || platform === 'android') {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark });
        if (platform === 'android') {
          await StatusBar.setBackgroundColor({ color: '#ffffff' });
        }
      }

      // Splash screen
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide({ fadeOutDuration: 500 });

      // Network
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();

      setState({ isNative: true, isOnline: status.connected, platform });
      console.log('[NativeApp] Initialized:', { platform, connected: status.connected });
    } catch (error) {
      console.error('[NativeApp] Init error:', error);
    }
  }, []);

  // Network listener
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

  // Deep links + back button
  useEffect(() => {
    let cleanupUrl: (() => void) | undefined;
    let cleanupBack: (() => void) | undefined;
    const setup = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        const { App } = await import('@capacitor/app');

        const urlH = await App.addListener('appUrlOpen', (e) => {
          if (e.url) {
            const path = new URL(e.url).pathname;
            window.location.href = path || '/';
          }
        });
        cleanupUrl = () => urlH.remove();

        const backH = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) window.history.back();
          else App.minimizeApp();
        });
        cleanupBack = () => backH.remove();
      } catch {}
    };
    setup();
    return () => { cleanupUrl?.(); cleanupBack?.(); };
  }, []);

  useEffect(() => { initializeNative(); }, [initializeNative]);

  // Haptics
  const vibrate = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
      await Haptics.impact({ style: map[style] });
    } catch {}
  }, []);

  // Share
  const shareContent = useCallback(async (opts: { title: string; text?: string; url?: string }) => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) {
        if (navigator.share) await navigator.share(opts);
        return;
      }
      const { Share } = await import('@capacitor/share');
      await Share.share(opts);
    } catch {}
  }, []);

  // Splash
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
