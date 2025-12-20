import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
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
 */
export const useIOSPushNotifications = () => {
  const { userId } = useStableAuth();
  const [state, setState] = useState<IOSPushState>({
    isSupported: false,
    isRegistered: false,
    token: null
  });

  // Check if push notifications are supported
  const checkSupport = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    
    // iOS requires explicit permission check
    if (Capacitor.getPlatform() === 'ios') {
      const permStatus = await PushNotifications.checkPermissions();
      return permStatus.receive !== 'denied';
    }
    
    return true;
  }, []);

  // Request push notification permissions
  const requestPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
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
  }, []);

  // Register for push notifications
  const register = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('[IOSPush] Not running on native platform');
      return;
    }

    try {
      const hasPermission = await requestPermissions();
      
      if (!hasPermission) {
        console.log('[IOSPush] Push notification permission denied');
        return;
      }

      // Register with APNs
      await PushNotifications.register();
      console.log('[IOSPush] Registration initiated');
    } catch (error) {
      console.error('[IOSPush] Registration error:', error);
    }
  }, [requestPermissions]);

  // Save token to Supabase
  const saveTokenToDatabase = useCallback(async (token: string) => {
    if (!userId) {
      console.log('[IOSPush] No user ID, skipping token save');
      return;
    }

    try {
      // Update profile with push token
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
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Check support on mount
    checkSupport().then(supported => {
      setState(prev => ({ ...prev, isSupported: supported }));
    });

    // Registration success handler
    const registrationListener = PushNotifications.addListener(
      'registration',
      async (token: Token) => {
        console.log('[IOSPush] Registration successful:', token.value);
        setState(prev => ({
          ...prev,
          isRegistered: true,
          token: token.value
        }));
        
        // Save token to database
        await saveTokenToDatabase(token.value);
      }
    );

    // Registration error handler
    const errorListener = PushNotifications.addListener(
      'registrationError',
      (error: any) => {
        console.error('[IOSPush] Registration error:', error);
        setState(prev => ({ ...prev, isRegistered: false }));
      }
    );

    // Notification received (foreground)
    const receivedListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('[IOSPush] Notification received:', notification);
        
        // The notification is displayed by iOS automatically
        // You can add custom handling here if needed
      }
    );

    // Notification action performed (tapped)
    const actionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('[IOSPush] Notification action:', action);
        
        // Handle notification tap - navigate to relevant page
        const data = action.notification.data;
        if (data?.url) {
          window.location.href = data.url;
        } else if (data?.link) {
          window.location.href = data.link;
        }
      }
    );

    // Cleanup
    return () => {
      registrationListener.then(l => l.remove());
      errorListener.then(l => l.remove());
      receivedListener.then(l => l.remove());
      actionListener.then(l => l.remove());
    };
  }, [checkSupport, saveTokenToDatabase]);

  // Auto-register when user is authenticated
  useEffect(() => {
    if (userId && Capacitor.isNativePlatform()) {
      register();
    }
  }, [userId, register]);

  return {
    ...state,
    register,
    requestPermissions
  };
};
