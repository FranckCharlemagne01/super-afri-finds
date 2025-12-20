import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';

interface IOSPushState {
  isSupported: boolean;
  isRegistered: boolean;
  token: string | null;
}

/**
 * iOS Push Notifications hook using Capacitor
 * Handles APNs registration and notification handling for App Store
 * Safe for web builds - only loads Capacitor when on native platform
 */
export const useIOSPushNotifications = () => {
  const { userId } = useStableAuth();
  const [state, setState] = useState<IOSPushState>({
    isSupported: false,
    isRegistered: false,
    token: null
  });

  // Check if running on native platform
  const isNativePlatform = useCallback(async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  }, []);

  // Request push notification permissions
  const requestPermissions = useCallback(async () => {
    try {
      if (!(await isNativePlatform())) return false;

      const { PushNotifications } = await import('@capacitor/push-notifications');
      const permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        const newStatus = await PushNotifications.requestPermissions();
        return newStatus.receive === 'granted';
      }
      
      return permStatus.receive === 'granted';
    } catch (error) {
      console.error('[IOSPush] Permission request error:', error);
      return false;
    }
  }, [isNativePlatform]);

  // Register for push notifications
  const register = useCallback(async () => {
    try {
      if (!(await isNativePlatform())) {
        console.log('[IOSPush] Not running on native platform');
        return;
      }

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        console.log('[IOSPush] Push notification permission denied');
        return;
      }

      const { PushNotifications } = await import('@capacitor/push-notifications');
      await PushNotifications.register();
      console.log('[IOSPush] Registration initiated');
    } catch (error) {
      console.error('[IOSPush] Registration error:', error);
    }
  }, [isNativePlatform, requestPermissions]);

  // Save token to Supabase
  const saveTokenToDatabase = useCallback(async (token: string) => {
    if (!userId) {
      console.log('[IOSPush] No user ID, skipping token save');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('user_id', userId);

      if (error) {
        console.error('[IOSPush] Error saving token:', error);
      } else {
        console.log('[IOSPush] Token saved to database');
      }
    } catch (error) {
      console.error('[IOSPush] Database error:', error);
    }
  }, [userId]);

  // Setup listeners
  useEffect(() => {
    let cleanupReg: (() => void) | undefined;
    let cleanupErr: (() => void) | undefined;
    let cleanupRec: (() => void) | undefined;
    let cleanupAct: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        if (!(await isNativePlatform())) return;

        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        // Check support
        const permStatus = await PushNotifications.checkPermissions();
        setState(prev => ({ ...prev, isSupported: permStatus.receive !== 'denied' }));

        // Registration success handler
        const regListener = await PushNotifications.addListener('registration', async (token) => {
          console.log('[IOSPush] Registration successful:', token.value);
          setState(prev => ({
            ...prev,
            isRegistered: true,
            token: token.value
          }));
          await saveTokenToDatabase(token.value);
        });
        cleanupReg = () => regListener.remove();

        // Registration error handler
        const errListener = await PushNotifications.addListener('registrationError', (error) => {
          console.error('[IOSPush] Registration error:', error);
          setState(prev => ({ ...prev, isRegistered: false }));
        });
        cleanupErr = () => errListener.remove();

        // Notification received (foreground)
        const recListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[IOSPush] Notification received:', notification);
        });
        cleanupRec = () => recListener.remove();

        // Notification action performed (tapped)
        const actListener = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('[IOSPush] Notification action:', action);
          const data = action.notification.data;
          if (data?.url) {
            window.location.href = data.url;
          } else if (data?.link) {
            window.location.href = data.link;
          }
        });
        cleanupAct = () => actListener.remove();
      } catch (error) {
        console.log('[IOSPush] Push notifications not available:', error);
      }
    };

    setupListeners();
    return () => {
      cleanupReg?.();
      cleanupErr?.();
      cleanupRec?.();
      cleanupAct?.();
    };
  }, [isNativePlatform, saveTokenToDatabase]);

  // Auto-register when user is authenticated
  useEffect(() => {
    if (userId) {
      register();
    }
  }, [userId, register]);

  return {
    ...state,
    register,
    requestPermissions
  };
};
