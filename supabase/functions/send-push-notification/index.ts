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

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== JWT AUTHENTICATION =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Push] Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    // Create client with user's auth to verify JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify JWT and get claims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('[Push] JWT verification failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const authenticatedUserId = claimsData.claims.sub;
    console.log('[Push] Authenticated user:', authenticatedUserId);

    // Check if user has superadmin role (can send to any user)
    const { data: roleData } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', authenticatedUserId)
      .single();

    const isSuperAdmin = roleData?.role === 'superadmin';

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

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: NotificationPayload = await req.json();

    // ===== INPUT VALIDATION =====
    if (!payload.title || typeof payload.title !== 'string' || payload.title.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Invalid title: must be a string up to 200 characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!payload.body || typeof payload.body !== 'string' || payload.body.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Invalid body: must be a string up to 1000 characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get target user IDs
    const targetUserIds: string[] = [];
    if (payload.user_id) {
      if (!isValidUUID(payload.user_id)) {
        return new Response(
          JSON.stringify({ error: 'Invalid user_id format' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      targetUserIds.push(payload.user_id);
    }
    if (payload.user_ids?.length) {
      for (const uid of payload.user_ids) {
        if (!isValidUUID(uid)) {
          return new Response(
            JSON.stringify({ error: 'Invalid user_id format in user_ids array' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        targetUserIds.push(uid);
      }
    }

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No target users specified' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // ===== AUTHORIZATION CHECK =====
    // Only superadmins can send to other users, regular users can only send to themselves
    if (!isSuperAdmin) {
      const sendingToOthers = targetUserIds.some(uid => uid !== authenticatedUserId);
      if (sendingToOthers) {
        console.error('[Push] Unauthorized: non-admin trying to send to other users');
        return new Response(
          JSON.stringify({ error: 'Forbidden: Cannot send notifications to other users' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }
    }

    console.log('[Push] Received notification request:', {
      user_id: payload.user_id,
      user_ids: payload.user_ids?.length,
      title: payload.title.substring(0, 50),
      tag: payload.tag,
      authenticatedBy: authenticatedUserId,
      isSuperAdmin
    });

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
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});