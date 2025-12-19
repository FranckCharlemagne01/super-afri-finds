import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';

// VAPID Public Key - must match the one in edge function
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | 'default';
  isSubscribed: boolean;
  isLoading: boolean;
}

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Generate unique device ID
function getDeviceId(): string {
  let deviceId = localStorage.getItem('djassa_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('djassa_device_id', deviceId);
  }
  return deviceId;
}

export const usePushNotifications = () => {
  const { userId } = useStableAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    isLoading: true
  });

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    const isSupported = 'serviceWorker' in navigator && 
                        'PushManager' in window && 
                        'Notification' in window;
    return isSupported;
  }, []);

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!checkSupport()) {
      setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setState(prev => ({
        ...prev,
        isSupported: true,
        permission: Notification.permission,
        isSubscribed: !!subscription,
        isLoading: false
      }));
    } catch (error) {
      console.error('[Push] Error checking subscription:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [checkSupport]);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[Push] Service Worker registered');
      return registration;
    } catch (error) {
      console.error('[Push] Service Worker registration failed:', error);
      return null;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      console.warn('[Push] User not authenticated');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('[Push] Permission denied');
        setState(prev => ({ 
          ...prev, 
          permission, 
          isLoading: false 
        }));
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      await navigator.serviceWorker.ready;

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource
      });

      // Extract keys
      const subscriptionJson = subscription.toJSON();
      const p256dh = subscriptionJson.keys?.p256dh || '';
      const auth = subscriptionJson.keys?.auth || '';

      // Save to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          device_id: getDeviceId(),
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'device_id'
        });

      if (error) {
        console.error('[Push] Error saving subscription:', error);
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      console.log('[Push] Successfully subscribed');
      setState(prev => ({
        ...prev,
        permission: 'granted',
        isSubscribed: true,
        isLoading: false
      }));

      return true;
    } catch (error) {
      console.error('[Push] Subscription error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [userId, registerServiceWorker]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from database
      const deviceId = getDeviceId();
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('device_id', deviceId);

      console.log('[Push] Successfully unsubscribed');
      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false
      }));

      return true;
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  // Check if should show permission prompt
  const shouldShowPrompt = useCallback((): boolean => {
    // Don't show if not supported
    if (!state.isSupported) return false;
    
    // Don't show if already subscribed
    if (state.isSubscribed) return false;
    
    // Don't show if permission was denied
    if (state.permission === 'denied') return false;
    
    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem('djassa_push_dismissed');
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Don't ask again for 7 days
      if (daysSinceDismissed < 7) return false;
    }

    return true;
  }, [state.isSupported, state.isSubscribed, state.permission]);

  // Dismiss prompt (user clicked "later")
  const dismissPrompt = useCallback(() => {
    localStorage.setItem('djassa_push_dismissed', new Date().toISOString());
  }, []);

  // Initialize
  useEffect(() => {
    if (checkSupport()) {
      registerServiceWorker().then(() => {
        checkSubscription();
      });
    } else {
      setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
    }
  }, [checkSupport, registerServiceWorker, checkSubscription]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    shouldShowPrompt,
    dismissPrompt
  };
};
