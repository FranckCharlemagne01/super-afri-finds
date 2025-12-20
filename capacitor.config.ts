import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e593e2a1db104fb9843927ce2702d6a2',
  appName: 'Djassa Marketplace',
  webDir: 'dist',
  
  // Production WebView pointing to djassa.tech
  server: {
    url: 'https://djassa.tech',
    cleartext: false // HTTPS only for App Store compliance
  },
  
  // iOS-specific configuration
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
    backgroundColor: '#ffffff',
    // Handle safe areas for notch devices
    preferredContentMode: 'mobile',
    // Allow inline media playback
    allowsInlineMediaPlayback: true
  },
  
  // Plugins configuration
  plugins: {
    // Push Notifications - iOS APNs
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    
    // Native Splash Screen
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
      // iOS specific
      iosSpinnerStyle: 'small',
      spinnerColor: '#F97316' // Primary orange color
    },
    
    // Status Bar - iOS style
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
      overlaysWebView: false
    },
    
    // Network detection for offline mode
    Network: {
      // Default configuration
    },
    
    // App lifecycle management
    App: {
      // Handle deep links
    },
    
    // Camera support (existing)
    Camera: {
      ios: {
        supportsImageLibrary: true
      }
    }
  }
};

export default config;
