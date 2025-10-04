import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to get encryption key (same method as paystack-config)
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get('ENCRYPTION_KEY');
  if (!keyString) {
    throw new Error('ENCRYPTION_KEY not configured');
  }
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString.padEnd(32, '0').slice(0, 32));
  
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

// Function to decrypt data using AES-GCM (same method as paystack-config)
async function decryptData(encryptedBase64: string): Promise<string> {
  const key = await getEncryptionKey();
  
  // Decode base64
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Function to get the current Paystack keys from encrypted config
async function getPaystackKeys(supabase: any): Promise<{ secretKey: string; publicKey: string; mode: string }> {
  try {
    // Get encrypted keys from database
    const { data: config, error } = await supabase
      .from('paystack_config')
      .select('encrypted_key_test, encrypted_key_live, encrypted_public_key_test, encrypted_public_key_live, mode')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ Database error:', error);
      throw new Error('Erreur lors de la récupération de la configuration Paystack');
    }

    if (!config) {
      throw new Error('Veuillez configurer vos clés Paystack dans le super admin');
    }

    // Select the right keys based on mode
    const encryptedSecretKey = config.mode === 'test' ? config.encrypted_key_test : config.encrypted_key_live;
    const encryptedPublicKey = config.mode === 'test' ? config.encrypted_public_key_test : config.encrypted_public_key_live;
    
    if (!encryptedSecretKey || !encryptedPublicKey) {
      throw new Error(`Clés Paystack ${config.mode} non configurées. Veuillez les ajouter dans le super admin.`);
    }

    // Decrypt the keys
    const secretKey = await decryptData(encryptedSecretKey);
    const publicKey = await decryptData(encryptedPublicKey);
    
    console.log(`✅ Using encrypted Paystack ${config.mode} keys from database`);
    console.log(`   Public key starts with: ${publicKey.substring(0, 7)}...`);
    
    return {
      secretKey,
      publicKey,
      mode: config.mode
    };
  } catch (error) {
    console.error('⚠️ Error getting encrypted Paystack keys:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Paystack keys from encrypted config (with fallback)
    const paystackKeys = await getPaystackKeys(supabase);

    if (!paystackKeys.secretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response(JSON.stringify({ error: 'Payment service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { action, ...payload } = await req.json();

    if (action === 'initialize_payment') {
      const { user_id, email, amount = 1000, payment_type = 'article_publication', product_data, tokens_amount } = payload;
      
      console.log('Initializing payment for user:', user_id);

      // Generate unique reference
      const reference = `premium_${user_id}_${Date.now()}`;

      // Store payment record in database
      const { error: dbError } = await supabase
        .from('premium_payments')
        .insert({
          user_id,
          paystack_reference: reference,
          amount,
          currency: 'XOF',
          status: 'pending',
          payment_type,
          product_data
        });

      if (dbError) {
        console.error('Database error:', dbError);
        return new Response(JSON.stringify({ error: 'Failed to create payment record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Si c'est un achat de jetons, créer aussi la transaction
      if (payment_type === 'tokens' && tokens_amount) {
        const { error: tokenTxError } = await supabase
          .from('token_transactions')
          .insert({
            seller_id: user_id,
            transaction_type: 'purchase',
            tokens_amount: tokens_amount,
            price_paid: amount,
            paystack_reference: reference,
            payment_method: payload.payment_method || 'card',
            status: 'pending'
          });

        if (tokenTxError) {
          console.error('Error creating token transaction:', tokenTxError);
        }
      }

      // Initialize payment with Paystack
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackKeys.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amount * 100, // Paystack expects smallest currency unit
          reference,
          currency: 'XOF',
          callback_url: `${req.headers.get('origin')}/seller?payment=success&reference=${reference}`,
          metadata: {
            user_id,
            payment_type,
            tokens_amount,
            product: payment_type === 'tokens' ? `Achat de ${tokens_amount} jetons` : (payment_type === 'article_publication' ? 'Publication d\'article' : 'Premium Seller Access')
          }
        }),
      });

      const paystackData = await paystackResponse.json();
      console.log('Paystack response:', paystackData);

      if (!paystackData.status) {
        return new Response(JSON.stringify({ error: 'Failed to initialize payment' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        status: 'success',
        data: {
          authorization_url: paystackData.data.authorization_url,
          access_code: paystackData.data.access_code,
          reference
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'verify_payment') {
      const { reference } = payload;
      
      console.log('Verifying payment for reference:', reference);

      // Verify payment with Paystack
      const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${paystackKeys.secretKey}`,
        },
      });

      const paystackData = await paystackResponse.json();
      console.log('Paystack verification response:', paystackData);

      if (!paystackData.status || paystackData.data.status !== 'success') {
        return new Response(JSON.stringify({ 
          error: 'Payment verification failed',
          status: paystackData.data?.status || 'unknown'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get payment record
      const { data: paymentRecord, error: fetchError } = await supabase
        .from('premium_payments')
        .select('*')
        .eq('paystack_reference', reference)
        .single();

      if (fetchError || !paymentRecord) {
        console.error('Payment record not found:', fetchError);
        return new Response(JSON.stringify({ error: 'Payment record not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

        // Handle payment based on type
        let updateError;
        if (paymentRecord.payment_type === 'tokens') {
          // Achat de jetons
          const tokensAmount = paystackData.data.metadata?.tokens_amount || 0;
          
          console.log('✅ Processing token purchase:', {
            seller_id: paymentRecord.user_id,
            tokens_amount: tokensAmount,
            price_paid: paystackData.data.amount / 100,
            reference
          });
          
          updateError = (await supabase
            .rpc('add_tokens_after_purchase', {
              _seller_id: paymentRecord.user_id,
              _tokens_amount: tokensAmount,
              _price_paid: paystackData.data.amount / 100,
              _paystack_reference: reference
            })).error;
            
          if (updateError) {
            console.error('❌ Error adding tokens:', updateError);
          } else {
            console.log('✅ Tokens added successfully');
          }
        } else if (paymentRecord.payment_type === 'article_publication') {
          // Publication d'article
          updateError = (await supabase
            .rpc('handle_article_payment_success', {
              _user_id: paymentRecord.user_id,
              _paystack_reference: reference,
              _amount: paystackData.data.amount / 100,
              _product_data: paymentRecord.product_data
            })).error;
        } else {
          // Abonnement premium (legacy)
          updateError = (await supabase
            .rpc('handle_premium_payment_success', {
              _user_id: paymentRecord.user_id,
              _paystack_reference: reference,
              _amount: paystackData.data.amount / 100
            })).error;
        }

      if (updateError) {
        console.error('Failed to update premium status:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update premium status' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        status: 'success',
        message: paymentRecord.payment_type === 'tokens'
          ? 'Jetons ajoutés avec succès'
          : (paymentRecord.payment_type === 'article_publication' 
            ? 'Paiement vérifié et article publié avec succès' 
            : 'Payment verified and premium access granted'),
        data: paystackData.data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in paystack-payment function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});