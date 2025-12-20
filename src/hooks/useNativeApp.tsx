import { useEffect, useState, useCallback } from 'react';

interface NativeAppState {
  isNative: boolean;
  isOnline: boolean;
  platform: string;
}

/**
 * Hook for managing native iOS app features
 * Handles status bar, splash screen, network status, and deep links
 * Safe for web builds - only loads Capacitor when on native platform
 */
export const useNativeApp = () => {
  const [state, setState] = useState<NativeAppState>({
    isNative: false,
    isOnline: true,
    platform: 'web'
  });

  // Initialize native features
  const initializeNative = useCallback(async () => {
    // Dynamic import to avoid build issues on web
    const { Capacitor } = await import('@capacitor/core');
    
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const platform = Capacitor.getPlatform();
      
      // Configure status bar for iOS
      if (platform === 'ios') {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
      }

      // Hide splash screen after app is ready
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide({
        fadeOutDuration: 500
      });

      // Check initial network status
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      
      setState({
        isNative: true,
        isOnline: status.connected,
        platform
      });

      console.log('[NativeApp] Initialized:', {
        platform,
        connected: status.connected
      });
    } catch (error) {
      console.error('[NativeApp] Initialization error:', error);
    }
  }, []);

  // Setup network listener
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setupNetworkListener = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { Network } = await import('@capacitor/network');
        const handler = await Network.addListener('networkStatusChange', (status) => {
          console.log('[NativeApp] Network status changed:', status);
          setState(prev => ({
            ...prev,
            isOnline: status.connected
          }));
        });

        cleanup = () => handler.remove();
      } catch (error) {
        console.log('[NativeApp] Network listener not available');
      }
    };

    setupNetworkListener();
    return () => cleanup?.();
  }, []);

  // Setup deep link and back button listeners
  useEffect(() => {
    let cleanupUrl: (() => void) | undefined;
    let cleanupBack: (() => void) | undefined;

    const setupAppListeners = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import('@capacitor/app');

        // Deep link handler
        const urlHandler = await App.addListener('appUrlOpen', (event) => {
          console.log('[NativeApp] Deep link received:', event.url);
          if (event.url) {
            window.location.href = event.url;
          }
        });
        cleanupUrl = () => urlHandler.remove();

        // Back button handler
        const backHandler = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            App.minimizeApp();
          }
        });
        cleanupBack = () => backHandler.remove();
      } catch (error) {
        console.log('[NativeApp] App listeners not available');
      }
    };

    setupAppListeners();
    return () => {
      cleanupUrl?.();
      cleanupBack?.();
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeNative();
  }, [initializeNative]);

  // Show splash screen
  const showSplash = useCallback(async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;

      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.show({
        showDuration: 2000,
        autoHide: true,
        fadeInDuration: 300,
        fadeOutDuration: 500
      });
    } catch (error) {
      console.log('[NativeApp] Splash not available');
    }
  }, []);

  // Hide splash screen
  const hideSplash = useCallback(async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;

      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide({ fadeOutDuration: 500 });
    } catch (error) {
      console.log('[NativeApp] Splash not available');
    }
  }, []);

  return {
    ...state,
    showSplash,
    hideSplash
  };
};
