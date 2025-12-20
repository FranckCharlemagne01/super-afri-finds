import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network, ConnectionStatus } from '@capacitor/network';

interface NativeAppState {
  isNative: boolean;
  isOnline: boolean;
  platform: string;
}

/**
 * Hook for managing native iOS app features
 * Handles status bar, splash screen, network status, and deep links
 */
export const useNativeApp = () => {
  const [state, setState] = useState<NativeAppState>({
    isNative: false,
    isOnline: true,
    platform: 'web'
  });

  // Initialize native features
  const initializeNative = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Configure status bar for iOS
      if (Capacitor.getPlatform() === 'ios') {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
      }

      // Hide splash screen after app is ready
      await SplashScreen.hide({
        fadeOutDuration: 500
      });

      // Check initial network status
      const status = await Network.getStatus();
      setState(prev => ({
        ...prev,
        isNative: true,
        isOnline: status.connected,
        platform: Capacitor.getPlatform()
      }));

      console.log('[NativeApp] Initialized:', {
        platform: Capacitor.getPlatform(),
        connected: status.connected
      });
    } catch (error) {
      console.error('[NativeApp] Initialization error:', error);
    }
  }, []);

  // Setup network listener
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const networkHandler = Network.addListener(
      'networkStatusChange',
      (status: ConnectionStatus) => {
        console.log('[NativeApp] Network status changed:', status);
        setState(prev => ({
          ...prev,
          isOnline: status.connected
        }));
      }
    );

    return () => {
      networkHandler.then(handler => handler.remove());
    };
  }, []);

  // Setup deep link listener for iOS Universal Links
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const urlHandler = App.addListener(
      'appUrlOpen',
      (event: URLOpenListenerEvent) => {
        console.log('[NativeApp] Deep link received:', event.url);
        
        // Handle deep links - navigate to appropriate route
        const url = new URL(event.url);
        const path = url.pathname;
        
        if (path) {
          // The WebView will handle navigation automatically
          // since we're loading djassa.tech
          window.location.href = event.url;
        }
      }
    );

    return () => {
      urlHandler.then(handler => handler.remove());
    };
  }, []);

  // Setup back button handler for iOS (swipe gesture)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const backHandler = App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        // Optionally minimize app or show exit confirmation
        App.minimizeApp();
      }
    });

    return () => {
      backHandler.then(handler => handler.remove());
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeNative();
  }, [initializeNative]);

  // Show splash screen (for refresh scenarios)
  const showSplash = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      await SplashScreen.show({
        showDuration: 2000,
        autoHide: true,
        fadeInDuration: 300,
        fadeOutDuration: 500
      });
    }
  }, []);

  // Hide splash screen
  const hideSplash = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      await SplashScreen.hide({
        fadeOutDuration: 500
      });
    }
  }, []);

  return {
    ...state,
    showSplash,
    hideSplash
  };
};
