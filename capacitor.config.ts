import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e593e2a1db104fb9843927ce2702d6a2',
  appName: 'djassa-marketplace',
  webDir: 'dist',

  // Hot-reload depuis le sandbox Lovable (désactiver en production)
  server: {
    url: 'https://e593e2a1-db10-4fb9-8439-27ce2702d6a2.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },

  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
    backgroundColor: '#ffffff',
    preferredContentMode: 'mobile',
    allowsInlineMediaPlayback: true
  },

  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },

  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      iosSpinnerStyle: 'small',
      spinnerColor: '#F97316'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
      overlaysWebView: false
    },
    Camera: {
      ios: {
        supportsImageLibrary: true
      }
    }
  }
};

export default config;
