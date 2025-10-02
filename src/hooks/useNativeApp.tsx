import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const useNativeApp = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Configurer la barre de statut
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#000000' });
    }
  }, []);

  const vibrate = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  return {
    isNative,
    platform,
    vibrate
  };
};
