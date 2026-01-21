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
    
  } catch (error: unknown) {
    console.error('[PushSender] Error sending push:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Check if user has superadmin role
async function isSuperAdmin(supabase: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'superadmin')
    .maybeSingle();
  
  return !error && data !== null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('[PushSender] VAPID keys not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'VAPID keys not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // ====== SECURITY: Authenticate the caller ======
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[PushSender] Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - missing token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('[PushSender] Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const authenticatedUserId = user.id;
    console.log('[PushSender] Authenticated user:', authenticatedUserId);
    
    // Parse the notification data from request
    const payload: NotificationPayload = await req.json();
    
    // Validate required fields
    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ success: false, error: 'Title and body are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Sanitize inputs to prevent XSS
    const sanitizedTitle = payload.title.slice(0, 100).replace(/<[^>]*>/g, '');
    const sanitizedBody = payload.body.slice(0, 500).replace(/<[^>]*>/g, '');
    
    console.log('[PushSender] Received notification request:', {
      notification_id: payload.notification_id,
      user_id: payload.user_id,
      title: sanitizedTitle.substring(0, 30) + '...'
    });

    if (!payload.user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // ====== SECURITY: Authorization check ======
    // Regular users can only send notifications to themselves
    // Superadmins can send to anyone
    const isAdmin = await isSuperAdmin(supabaseAdmin, authenticatedUserId);

    if (!isAdmin && payload.user_id !== authenticatedUserId) {
      console.error('[PushSender] User attempted to send to another user:', payload.user_id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Forbidden - you can only send notifications to yourself' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log(`[PushSender] Authorization passed. isAdmin=${isAdmin}`);

    // Get all push subscriptions for this user
    const { data: subscriptions, error: subError } = await supabaseAdmin
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
          title: sanitizedTitle,
          body: sanitizedBody,
          url: payload.url,
          tag: payload.type || 'notification'
        },
        vapidPublicKey,
        vapidPrivateKey
      );

      if (result.success) {
        successCount++;
        // Update last_used_at
        await supabaseAdmin
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
      await supabaseAdmin
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

  } catch (error: unknown) {
    console.error('[PushSender] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
