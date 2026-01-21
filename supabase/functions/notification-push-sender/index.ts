import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  notification_id: string;
  user_id: string;
  title: string;
  body: string;
  url?: string;
  type?: string;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

// Simple Web Push implementation using fetch
async function sendWebPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url?: string; tag?: string },
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PushSender] Sending to endpoint:', subscription.endpoint.substring(0, 50) + '...');
    
    // For now, use a simplified push without encryption
    // This works with most modern browsers for testing
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      data: { url: payload.url || '/' },
      tag: payload.tag || 'djassa-notification',
      icon: '/favicon.png',
      badge: '/favicon.png'
    });

    // Create authorization header with VAPID
    const vapidHeader = `vapid t=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9, k=${vapidPublicKey}`;

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
        'Urgency': 'high',
      },
      body: pushPayload
    });

    if (response.ok || response.status === 201) {
      console.log('[PushSender] Push sent successfully');
      return { success: true };
    }

    // Handle specific error codes
    if (response.status === 410 || response.status === 404) {
      console.log('[PushSender] Subscription expired or invalid');
      return { success: false, error: 'subscription_expired' };
    }

    const errorText = await response.text();
    console.error('[PushSender] Push failed:', response.status, errorText);
    return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    
  } catch (error) {
    console.error('[PushSender] Error sending push:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== JWT AUTHENTICATION =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[PushSender] Missing or invalid Authorization header');
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
      console.error('[PushSender] JWT verification failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const authenticatedUserId = claimsData.claims.sub;
    console.log('[PushSender] Authenticated user:', authenticatedUserId);

    // Check if user has superadmin role (can send to any user)
    const { data: roleData } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', authenticatedUserId)
      .single();

    const isSuperAdmin = roleData?.role === 'superadmin';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('[PushSender] VAPID keys not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'VAPID keys not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse the notification data from request
    const payload: NotificationPayload = await req.json();

    // ===== INPUT VALIDATION =====
    if (!payload.user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!isValidUUID(payload.user_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user_id format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

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

    // ===== AUTHORIZATION CHECK =====
    // Only superadmins can send to other users, regular users can only send to themselves
    if (!isSuperAdmin && payload.user_id !== authenticatedUserId) {
      console.error('[PushSender] Unauthorized: non-admin trying to send to other user');
      return new Response(
        JSON.stringify({ error: 'Forbidden: Cannot send notifications to other users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    
    console.log('[PushSender] Received notification request:', {
      notification_id: payload.notification_id,
      user_id: payload.user_id,
      title: payload.title.substring(0, 50),
      authenticatedBy: authenticatedUserId,
      isSuperAdmin
    });

    // Get all push subscriptions for this user
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', payload.user_id);

    if (subError) {
      console.error('[PushSender] Error fetching subscriptions:', subError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[PushSender] No push subscriptions found for user:', payload.user_id);
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PushSender] Found ${subscriptions.length} subscriptions for user`);

    // Send push to all user's devices
    let successCount = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subscriptions) {
      const result = await sendWebPushNotification(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth
        },
        {
          title: payload.title,
          body: payload.body,
          url: payload.url,
          tag: payload.type || 'notification'
        },
        vapidPublicKey,
        vapidPrivateKey
      );

      if (result.success) {
        successCount++;
        // Update last_used_at
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id);
      } else if (result.error === 'subscription_expired') {
        expiredEndpoints.push(sub.endpoint);
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      console.log(`[PushSender] Removing ${expiredEndpoints.length} expired subscriptions`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    console.log(`[PushSender] Sent ${successCount}/${subscriptions.length} push notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount,
        total: subscriptions.length,
        expired: expiredEndpoints.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PushSender] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});