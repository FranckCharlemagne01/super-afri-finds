import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e593e2a1db104fb9843927ce2702d6a2',
  appName: 'Djassa Marketplace',
  webDir: 'dist',
  server: {
    url: 'https://e593e2a1-db10-4fb9-8439-27ce2702d6a2.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Camera: {
      ios: {
        supportsImageLibrary: true
      },
      android: {
        allowEditing: true
      }
    }
  }
};

export default config;
