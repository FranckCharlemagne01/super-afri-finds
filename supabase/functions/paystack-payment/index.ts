import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SECURITY: Rate limiting implementation
const RATE_LIMITS = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimits = RATE_LIMITS.get(identifier) || [];
  
  // Remove old requests outside window
  const validRequests = userLimits.filter(
    (timestamp: number) => now - timestamp < WINDOW_MS
  );
  
  if (validRequests.length >= MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }
  
  validRequests.push(now);
  RATE_LIMITS.set(identifier, validRequests);
  return true;
}

// SECURITY: Define fixed pricing for token packages (server-side source of truth)
const TOKEN_PRICES: Record<number, number> = {
  5: 1000,
  12: 2000,
  30: 5000,
  65: 10000,
};

// SECURITY: Input validation schemas
const productDataSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000),
  price: z.number().positive().max(100000000),
  original_price: z.number().positive().max(100000000).optional(),
  category: z.string().trim().min(3).max(50),
  stock_quantity: z.number().int().min(0).max(100000).optional(),
  discount_percentage: z.number().int().min(0).max(100).optional(),
  is_flash_sale: z.boolean().optional(),
  badge: z.string().trim().max(50).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  video_url: z.string().url().optional(),
}).strict();

const initializePaymentSchema = z.object({
  user_id: z.string().uuid(),
  email: z.string().email().max(255),
  amount: z.number().int().min(100).max(10000000),
  payment_type: z.enum(['tokens', 'article_publication', 'subscription']),
  tokens_amount: z.number().int().min(5).max(10000).optional(),
  payment_method: z.enum(['card', 'orange_money', 'mtn_money', 'moov_money', 'wave_money']).optional(),
  product_data: productDataSchema.optional(),
}).strict();

const verifyPaymentSchema = z.object({
  reference: z.string().trim().min(1).max(200),
}).strict();

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
    // SECURITY: Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Rate limiting check
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const identifier = `${ip}-${authHeader.substring(0, 20)}`;
    
    if (!checkRateLimit(identifier)) {
      return new Response(
        JSON.stringify({ 
          error: 'Trop de requêtes. Veuillez réessayer plus tard.' 
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '900' }
        }
      );
    }

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
    const requestBody = await req.json();
    const { action, ...payload } = requestBody;

    if (action === 'initialize_payment') {
      // SECURITY: Validate input with Zod schema
      let validatedPayload;
      try {
        validatedPayload = initializePaymentSchema.parse(payload);
      } catch (error) {
        console.error('❌ Input validation failed:', error);
        return new Response(JSON.stringify({ 
          error: 'Invalid input parameters',
          details: error instanceof z.ZodError ? error.errors : 'Validation failed'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { user_id, email, amount, payment_type, product_data, tokens_amount, payment_method } = validatedPayload;
      
      // SECURITY: Server-side price validation for token purchases
      if (payment_type === 'tokens') {
        if (!tokens_amount) {
          return new Response(JSON.stringify({ error: 'tokens_amount is required for token purchases' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const expectedAmount = TOKEN_PRICES[tokens_amount];
        if (!expectedAmount) {
          return new Response(JSON.stringify({ 
            error: 'Invalid token package',
            details: `Available packages: ${Object.keys(TOKEN_PRICES).join(', ')} tokens`
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (amount !== expectedAmount) {
          console.error(`❌ Price manipulation attempt: Expected ${expectedAmount} FCFA for ${tokens_amount} tokens, received ${amount} FCFA`);
          return new Response(JSON.stringify({ 
            error: 'Invalid payment amount',
            expected: expectedAmount,
            received: amount
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // SECURITY: Sanitize product_data if present (remove any script tags, limit HTML)
      let sanitizedProductData = product_data;
      if (product_data) {
        sanitizedProductData = {
          ...product_data,
          title: product_data.title.replace(/<[^>]*>/g, '').trim(),
          description: product_data.description.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim(),
        };
      }
      
      console.log('✅ Input validated. Initializing payment for user:', user_id);

      // Generate unique reference based on payment type
      const reference = payment_type === 'tokens' 
        ? `tokens_${user_id}_${Date.now()}`
        : `premium_${user_id}_${Date.now()}`;

      // Store payment record in database with sanitized data and mode
      const { error: dbError } = await supabase
        .from('premium_payments')
        .insert({
          user_id,
          paystack_reference: reference,
          amount,
          currency: 'XOF',
          status: 'pending',
          payment_type,
          product_data: {
            ...sanitizedProductData,
            payment_mode: paystackKeys.mode // Store mode (test/live) in product_data
          }
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
        console.log(`💰 Creating token transaction: ${tokens_amount} tokens for ${amount} FCFA`);
        
        const { error: tokenTxError } = await supabase
          .from('token_transactions')
          .insert({
            seller_id: user_id,
            transaction_type: 'purchase',
            tokens_amount: tokens_amount,
            price_paid: amount,
            paystack_reference: reference,
            payment_method: payment_method || 'card',
            status: 'pending'
          });

        if (tokenTxError) {
          console.error('❌ Error creating token transaction:', tokenTxError);
        } else {
          console.log('✅ Token transaction created with reference:', reference);
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
          callback_url: `${req.headers.get('origin')}/seller-dashboard?payment=success&reference=${reference}`,
          metadata: {
            user_id,
            payment_type,
            tokens_amount,
            payment_method,
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
      // SECURITY: Validate input with Zod schema
      let validatedPayload;
      try {
        validatedPayload = verifyPaymentSchema.parse(payload);
      } catch (error) {
        console.error('❌ Verification input validation failed:', error);
        return new Response(JSON.stringify({ 
          error: 'Invalid verification parameters',
          details: error instanceof z.ZodError ? error.errors : 'Validation failed'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { reference } = validatedPayload;
      
      console.log('✅ Verification input validated. Verifying payment for reference:', reference);

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

      // DETECTION AUTOMATIQUE DU MODE via Paystack response
      const isTestPayment = paystackData.data.domain === 'test';
      const paymentMode = isTestPayment ? 'test' : 'live';
      
      console.log(`💳 Payment mode detected: ${paymentMode.toUpperCase()}`);

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

      // MODE TEST: Ne pas ajouter de crédits réels
      if (isTestPayment) {
        console.log('🧪 TEST MODE: Payment successful but NO credits will be added');
        
        // Mettre à jour le statut du paiement comme test_success
        await supabase
          .from('premium_payments')
          .update({
            status: 'test_success',
            payment_date: new Date().toISOString()
          })
          .eq('paystack_reference', reference);

        return new Response(JSON.stringify({
          status: 'success',
          test_mode: true,
          message: '🧪 MODE TEST: Paiement simulé réussi. Aucun crédit réel n\'a été ajouté à votre compte.',
          warning: 'Vous êtes en mode test : aucun crédit réel n\'a été ajouté.',
          data: {
            reference,
            amount: paystackData.data.amount / 100,
            payment_mode: 'test',
            tokens_amount: paystackData.data.metadata?.tokens_amount || 0
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // MODE LIVE: Traitement normal avec ajout de crédits
      console.log('💰 LIVE MODE: Processing real payment and adding credits');
      
      let updateError;
      if (paymentRecord.payment_type === 'tokens') {
        // Achat de jetons
        const tokensAmount = paystackData.data.metadata?.tokens_amount || 0;
        
        console.log('✅ Processing token purchase:', {
          seller_id: paymentRecord.user_id,
          tokens_amount: tokensAmount,
          price_paid: paystackData.data.amount / 100,
          reference,
          metadata: paystackData.data.metadata
        });
        
        // Initialiser les jetons du vendeur si nécessaire
        await supabase.rpc('initialize_seller_tokens', { _seller_id: paymentRecord.user_id });
        
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
          console.log('✅ Tokens added successfully to seller:', paymentRecord.user_id);
          
          // Vérifier que les jetons ont bien été ajoutés
          const { data: tokenData } = await supabase
            .from('seller_tokens')
            .select('token_balance')
            .eq('seller_id', paymentRecord.user_id)
            .single();
          
          console.log('📊 New token balance:', tokenData?.token_balance);
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
        test_mode: false,
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

  } catch (error: unknown) {
    console.error('Error in paystack-payment function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});