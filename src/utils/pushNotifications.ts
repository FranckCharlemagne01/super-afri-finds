import { SupabaseClient } from '@supabase/supabase-js';

export type PushPayload = {
  user_id?: string;
  user_ids?: string[];
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/**
 * Thin wrapper around the public edge function `send-push-notification`.
 * Never throws: returns `{ ok: boolean }` for safe fire-and-forget usage.
 */
export async function sendPushNotification(
  supabase: SupabaseClient,
  payload: PushPayload
): Promise<{ ok: boolean; data?: unknown; error?: unknown }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: payload,
    });

    if (error) {
      console.error('[Push] send-push-notification error:', error);
      return { ok: false, error };
    }

    console.log('[Push] send-push-notification ok:', data);
    return { ok: true, data };
  } catch (error) {
    console.error('[Push] send-push-notification failed:', error);
    return { ok: false, error };
  }
}
