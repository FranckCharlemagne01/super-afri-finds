import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // ============ AUTHENTICATION CHECK ============
    // Verify the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Authentification requise' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Create a client with the user's token to verify identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Get the authenticated user
    const { data: { user: authenticatedUser }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !authenticatedUser) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Token invalide ou expiré' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('Authenticated user:', authenticatedUser.id);
    // ============ END AUTHENTICATION CHECK ============

    const { action, user_id, email, reference, amount } = await req.json();

    // ============ AUTHORIZATION CHECK ============
    // Verify that the authenticated user matches the user_id in the request
    if (user_id && user_id !== authenticatedUser.id) {
      console.error('User ID mismatch:', { requested: user_id, authenticated: authenticatedUser.id });
      return new Response(
        JSON.stringify({ success: false, error: 'Non autorisé - ID utilisateur non concordant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    // ============ END AUTHORIZATION CHECK ============

    console.log('Subscription payment request:', { action, user_id: authenticatedUser.id, email, reference });

    // Get Paystack config
    const { data: paystackConfig, error: configError } = await supabaseAdmin
      .from('paystack_config')
      .select('*')
      .single();

    if (configError || !paystackConfig) {
      console.error('Paystack config error:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration Paystack non trouvée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get decrypted secret key based on mode
    // Try both key names for backwards compatibility
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY') || Deno.env.get('PAYSTACK_ENCRYPTION_KEY');
    if (!encryptionKey) {
      console.error('Missing ENCRYPTION_KEY or PAYSTACK_ENCRYPTION_KEY');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration serveur manquante - clé de chiffrement non configurée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const isLiveMode = paystackConfig.mode === 'live';
    const encryptedKey = isLiveMode 
      ? paystackConfig.encrypted_key_live 
      : paystackConfig.encrypted_key_test;

    if (!encryptedKey) {
      console.error('No Paystack key configured for mode:', paystackConfig.mode);
      return new Response(
        JSON.stringify({ success: false, error: `Clé Paystack ${paystackConfig.mode} non configurée` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // AES-256-GCM decryption (matching paystack-config encryption)
    const decryptData = async (encryptedBase64: string, keyString: string): Promise<string> => {
      try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(keyString.padEnd(32, '0').slice(0, 32));
        
        const key = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );
        
        // Decode base64
        const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        
        // Extract IV (first 12 bytes) and encrypted data
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);
        
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          encrypted
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
      } catch (e) {
        console.error('AES-GCM Decryption error:', e);
        return '';
      }
    };

    const paystackSecretKey = await decryptData(encryptedKey, encryptionKey);

    if (!paystackSecretKey || !paystackSecretKey.startsWith('sk_')) {
      console.error('Invalid Paystack key after decryption - key does not start with sk_');
      return new Response(
        JSON.stringify({ success: false, error: 'Clé Paystack invalide - veuillez reconfigurer les clés dans le panneau admin' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log('Paystack key decrypted successfully, mode:', paystackConfig.mode);

    // Use authenticated user's ID for all operations
    const effectiveUserId = authenticatedUser.id;
    const effectiveEmail = email || authenticatedUser.email;

    // Handle different actions
    if (action === 'initialize') {
      // Initialize Paystack payment
      const subscriptionAmount = 5000; // 5000 XOF monthly
      const callbackUrl = `${req.headers.get('origin')}/seller-dashboard?subscription_payment=verify&reference=`;

      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: effectiveEmail,
          amount: subscriptionAmount * 100, // Paystack uses kobo/pesewas
          currency: 'XOF',
          callback_url: callbackUrl,
          metadata: {
            user_id: effectiveUserId,
            payment_type: 'subscription',
            custom_fields: [
              {
                display_name: 'Type',
                variable_name: 'type',
                value: 'Abonnement Vendeur Djassa'
              }
            ]
          }
        }),
      });

      const paystackData = await paystackResponse.json();
      console.log('Paystack initialize response:', paystackData);

      if (!paystackData.status) {
        return new Response(
          JSON.stringify({ success: false, error: paystackData.message || 'Erreur Paystack' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          authorization_url: paystackData.data.authorization_url,
          reference: paystackData.data.reference,
          access_code: paystackData.data.access_code
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      // Verify payment with Paystack
      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
        },
      });

      const verifyData = await verifyResponse.json();
      console.log('Paystack verify response:', verifyData);

      if (!verifyData.status || verifyData.data.status !== 'success') {
        return new Response(
          JSON.stringify({ success: false, error: 'Paiement non vérifié' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Verify that the payment was made for the authenticated user
      const paymentUserId = verifyData.data.metadata?.user_id;
      if (paymentUserId && paymentUserId !== effectiveUserId) {
        console.error('Payment user ID mismatch:', { payment: paymentUserId, authenticated: effectiveUserId });
        return new Response(
          JSON.stringify({ success: false, error: 'Ce paiement appartient à un autre utilisateur' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      // Check if this is a live or test payment
      const isLivePayment = verifyData.data.domain === 'live';
      const paidAmount = verifyData.data.amount / 100; // Convert from kobo

      if (!isLivePayment && isLiveMode) {
        console.log('Test payment in live mode - not activating subscription');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'MODE TEST: Paiement simulé. Abonnement non activé.',
            is_test: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Activate subscription using the authenticated user's ID
      const { data: activationResult, error: activationError } = await supabaseAdmin
        .rpc('activate_subscription', {
          _user_id: effectiveUserId,
          _paystack_reference: reference,
          _amount: paidAmount
        });

      if (activationError) {
        console.error('Subscription activation error:', activationError);
        return new Response(
          JSON.stringify({ success: false, error: 'Erreur lors de l\'activation de l\'abonnement' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('Subscription activated successfully for user:', effectiveUserId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Abonnement activé avec succès',
          subscription_active: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Action non reconnue' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error: unknown) {
    console.error('Subscription payment error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
