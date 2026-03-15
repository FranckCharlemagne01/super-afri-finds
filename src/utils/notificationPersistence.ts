import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  icon?: string;
}

/**
 * Inserts a notification into the notifications table
 * so it appears in the NotificationCenter bell panel.
 */
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  link,
  icon,
}: CreateNotificationParams) => {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      link: link || null,
      icon: icon || null,
      is_read: false,
    });
    if (error) console.error('Error creating notification:', error);
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};
