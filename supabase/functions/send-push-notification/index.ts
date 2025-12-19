import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  user_id?: string;
  user_ids?: string[];
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

// Web Push implementation
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url?: string; tag?: string },
  vapidPrivateKey: string,
  vapidPublicKey: string
): Promise<boolean> {
  try {
    // Import web-push compatible crypto functions
    const encoder = new TextEncoder();
    
    // Create JWT for VAPID
    const jwtHeader = { typ: 'JWT', alg: 'ES256' };
    const audience = new URL(subscription.endpoint).origin;
    const jwtPayload = {
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
      sub: 'mailto:notifications@djassa.tech'
    };

    // Base64URL encode
    const base64UrlEncode = (data: string): string => {
      return btoa(data)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    };

    const headerB64 = base64UrlEncode(JSON.stringify(jwtHeader));
    const payloadB64 = base64UrlEncode(JSON.stringify(jwtPayload));
    const unsignedToken = `${headerB64}.${payloadB64}`;

    // Import private key for signing
    const privateKeyBuffer = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    ).catch(() => null);

    if (!cryptoKey) {
      // Fallback: try raw key format
      console.log('[Push] Using simplified push without encryption');
      
      // Send without encryption for now (works with some browsers)
      const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TTL': '86400',
        },
        body: JSON.stringify({
          title: payload.title,
          body: payload.body,
          data: { url: payload.url || '/' },
          tag: payload.tag || 'djassa-notification'
        })
      });

      return response.ok;
    }

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      cryptoKey,
      encoder.encode(unsignedToken)
    );

    const signatureB64 = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
    const jwt = `${unsignedToken}.${signatureB64}`;

    // Create push message body
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      data: { url: payload.url || '/' },
      tag: payload.tag || 'djassa-notification'
    });

    // Send push notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Urgency': 'normal',
      },
      body: encoder.encode(pushPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Push] Push failed:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Push] Error sending push:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('[Push] VAPID keys not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'VAPID keys not configured' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: NotificationPayload = await req.json();

    console.log('[Push] Received notification request:', {
      user_id: payload.user_id,
      user_ids: payload.user_ids?.length,
      title: payload.title
    });

    // Get target user IDs
    const targetUserIds: string[] = [];
    if (payload.user_id) {
      targetUserIds.push(payload.user_id);
    }
    if (payload.user_ids?.length) {
      targetUserIds.push(...payload.user_ids);
    }

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No target users specified' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get push subscriptions for target users
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUserIds);

    if (subError) {
      console.error('[Push] Error fetching subscriptions:', subError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Push] No subscriptions found for users:', targetUserIds);
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Push] Found ${subscriptions.length} subscriptions`);

    // Send to all subscriptions
    let successCount = 0;
    let failedEndpoints: string[] = [];

    for (const sub of subscriptions) {
      const success = await sendWebPush(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth
        },
        {
          title: payload.title,
          body: payload.body,
          url: payload.url,
          tag: payload.tag
        },
        vapidPrivateKey,
        vapidPublicKey
      );

      if (success) {
        successCount++;
        // Update last_used_at
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id);
      } else {
        failedEndpoints.push(sub.endpoint);
      }
    }

    // Clean up failed subscriptions (likely expired)
    if (failedEndpoints.length > 0) {
      console.log(`[Push] Cleaning up ${failedEndpoints.length} failed subscriptions`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', failedEndpoints);
    }

    console.log(`[Push] Sent ${successCount}/${subscriptions.length} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount,
        total: subscriptions.length,
        failed: failedEndpoints.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Push] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
