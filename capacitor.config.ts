import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuration Capacitor pour Djassa Marketplace
 * 
 * MODE DÉVELOPPEMENT : Décommenter le bloc "server" pour le hot-reload
 * MODE PRODUCTION    : Le bloc "server" doit rester commenté (l'app charge les fichiers locaux depuis dist/)
 */
const config: CapacitorConfig = {
  appId: 'tech.djassa.marketplace',
  appName: 'Djassa',
  webDir: 'dist',

  // ─── HOT-RELOAD (Développement uniquement) ───
  // Décommenter pour tester en temps réel depuis le sandbox Lovable.
  // IMPORTANT : Commenter ce bloc AVANT de build pour les stores.
  //
  // server: {
  //   url: 'https://e593e2a1-db10-4fb9-8439-27ce2702d6a2.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },

  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: '#0b0f19',
    preferredContentMode: 'mobile',
    allowsInlineMediaPlayback: true,
    // Empêche les liens externes d'ouvrir Safari dans l'app
    limitsNavigationsToAppBoundDomains: true
  },

  android: {
    backgroundColor: '#0b0f19',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Empêche le zoom par pinch
    initialScale: '1.0',
    minimumFontSize: 16
  },

  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#0b0f19',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      splashFullScreen: true,
      splashImmersive: true,
      iosSpinnerStyle: 'small',
      spinnerColor: '#FF6B35'
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0b0f19',
      overlaysWebView: false
    },
    Camera: {
      ios: {
        supportsImageLibrary: true
      }
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
