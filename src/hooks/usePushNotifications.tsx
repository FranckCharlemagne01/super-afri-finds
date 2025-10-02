import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePushNotifications = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // Ne pas initialiser les notifications sur le web
    }

    const initPushNotifications = async () => {
      try {
        // Demander la permission
        const permission = await PushNotifications.requestPermissions();
        
        if (permission.receive === 'granted') {
          await PushNotifications.register();
        }

        // Écouter l'enregistrement réussi
        await PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token: ' + token.value);
          
          // Sauvegarder le token dans la base de données
          if (user) {
            await supabase
              .from('profiles')
              .update({ push_token: token.value })
              .eq('user_id', user.id);
          }
        });

        // Écouter les erreurs d'enregistrement
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        // Écouter les notifications reçues
        await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            toast({
              title: notification.title || 'Nouvelle notification',
              description: notification.body,
            });
          }
        );

        // Écouter les actions sur les notifications
        await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification) => {
            console.log('Push notification action performed', notification);
          }
        );
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    initPushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user, toast]);

  return {
    async sendNotification(userId: string, title: string, body: string) {
      try {
        // Récupérer le token de l'utilisateur
        const { data: profile } = await supabase
          .from('profiles')
          .select('push_token')
          .eq('user_id', userId)
          .single();

        if (profile?.push_token) {
          // Appeler une Edge Function pour envoyer la notification via FCM/APNs
          await supabase.functions.invoke('send-push-notification', {
            body: {
              token: profile.push_token,
              title,
              body
            }
          });
        }
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }
  };
};
