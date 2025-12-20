import { ReactNode } from 'react';
import { useNativeApp } from '@/hooks/useNativeApp';
import { useIOSPushNotifications } from '@/hooks/useIOSPushNotifications';
import { OfflineIndicator } from '@/components/OfflineIndicator';

interface NativeAppProviderProps {
  children: ReactNode;
}

/**
 * Provider component that initializes native iOS features
 * Must be placed INSIDE AuthProvider since useIOSPushNotifications needs auth context
 */
export const NativeAppProvider = ({ children }: NativeAppProviderProps) => {
  // Initialize native iOS app features
  const { isNative, isOnline } = useNativeApp();
  
  // Initialize iOS Push Notifications (auto-registers when user is authenticated)
  useIOSPushNotifications();

  return (
    <>
      {/* Offline indicator for iOS native app */}
      <OfflineIndicator isOffline={isNative && !isOnline} />
      {children}
    </>
  );
};
