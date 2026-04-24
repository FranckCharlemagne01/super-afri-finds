import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Helper: always return 200 so supabase.functions.invoke can read the body
function respond(ok: boolean, payload: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify({ success: ok, ...payload }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// SECURITY: Rate limiting
const RATE_LIMITS = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 10;

function checkRateLimit(id: string): boolean {
  const now = Date.now();
  const list = (RATE_LIMITS.get(id) || []).filter(t => now - t < WINDOW_MS);
  if (list.length >= MAX_REQUESTS) return false;
  list.push(now);
  RATE_LIMITS.set(id, list);
  return true;
}

// Fixed token pricing (server-side source of truth)
const TOKEN_PRICES: Record<number, number> = { 5: 1000, 12: 2000, 30: 5000, 65: 10000 };

// Encryption helpers (same as paystack-config)
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get('ENCRYPTION_KEY');
  if (!keyString) throw new Error('ENCRYPTION_KEY not configured');
  const keyData = new TextEncoder().encode(keyString.padEnd(32, '0').slice(0, 32));
  return crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
}

async function decryptData(encryptedBase64: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  return new TextDecoder().decode(decrypted);
}

// Get Paystack keys from encrypted DB config, fallback to env secret
async function getPaystackKeys(supabase: any): Promise<{ secretKey: string; mode: string }> {
  try {
    const { data: config, error } = await supabase
      .from('paystack_config')
      .select('encrypted_key_test, encrypted_key_live, mode')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ DB config error:', error);
      throw error;
    }

    if (config) {
      const encryptedKey = config.mode === 'test' ? config.encrypted_key_test : config.encrypted_key_live;
      if (encryptedKey) {
        const secretKey = await decryptData(encryptedKey);
        console.log(`✅ Using encrypted Paystack ${config.mode} key from DB`);
        return { secretKey, mode: config.mode };
      }
    }
  } catch (e) {
    console.warn('⚠️ Could not get encrypted keys, trying env fallback:', e);
  }

  // Fallback: use PAYSTACK_SECRET_KEY env var
  const envKey = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (envKey) {
    const mode = envKey.startsWith('sk_test_') ? 'test' : 'live';
    console.log(`✅ Using PAYSTACK_SECRET_KEY env var (${mode} mode)`);
    return { secretKey: envKey, mode };
  }

  throw new Error('No Paystack secret key available (neither DB config nor env var)');
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📥 paystack-payment called, method:', req.method);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return respond(false, { error: 'Authentication required' });
    }

    // Rate limit
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`${ip}-${authHeader.substring(0, 20)}`)) {
      return respond(false, { error: 'Trop de requêtes. Réessayez plus tard.' });
    }

    // Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Paystack keys
    let paystackKeys: { secretKey: string; mode: string };
    try {
      paystackKeys = await getPaystackKeys(supabase);
    } catch (e) {
      console.error('❌ Paystack key error:', e);
      return respond(false, { error: 'Configuration Paystack manquante. Contactez l\'administrateur.' });
    }

    // Parse body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return respond(false, { error: 'Invalid JSON body' });
    }

    const { action, ...payload } = body;
    console.log('📦 Action:', action, '| Payload keys:', Object.keys(payload));

    // ============================================================
    // ACTION: initialize_payment
    // ============================================================
    if (action === 'initialize_payment') {
      const { user_id, email, amount, payment_type, tokens_amount, payment_method, product_data } = payload;

      // Basic validation
      if (!user_id || !email || !amount || !payment_type) {
        return respond(false, { error: 'Champs requis manquants: user_id, email, amount, payment_type' });
      }

      if (typeof amount !== 'number' || amount < 500) {
        return respond(false, { error: 'Le montant minimum est de 500 FCFA' });
      }

      // Token price validation
      if (payment_type === 'tokens') {
        if (!tokens_amount) {
          return respond(false, { error: 'tokens_amount requis pour un achat de jetons' });
        }
        const expected = TOKEN_PRICES[tokens_amount];
        if (expected && amount !== expected) {
          console.error(`❌ Price mismatch: expected ${expected}, got ${amount}`);
          return respond(false, { error: 'Montant invalide pour ce pack de jetons' });
        }
      }

      console.log(`✅ Validated. Initializing ${payment_type} payment: ${amount} FCFA for ${user_id}`);

      // Generate reference
      const prefix = payment_type === 'wallet_recharge' ? 'wallet' : (payment_type === 'tokens' ? 'tokens' : 'premium');
      const reference = `${prefix}_${user_id}_${Date.now()}`;

      // Store payment record
      const { error: dbError } = await supabase
        .from('premium_payments')
        .insert({
          user_id,
          paystack_reference: reference,
          amount,
          currency: 'XOF',
          status: 'pending',
          payment_type,
          product_data: { ...product_data, payment_mode: paystackKeys.mode }
        });

      if (dbError) {
        console.error('❌ DB insert error:', dbError);
        return respond(false, { error: 'Erreur lors de la création de l\'enregistrement de paiement' });
      }

      // Create token transaction if applicable
      if (payment_type === 'tokens' && tokens_amount) {
        await supabase.from('token_transactions').insert({
          seller_id: user_id,
          transaction_type: 'purchase',
          tokens_amount,
          price_paid: amount,
          paystack_reference: reference,
          payment_method: payment_method || 'card',
          status: 'pending'
        });
      }

      // Determine callback URL
      const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || 'https://djassa-marketplace.lovable.app';
      const callbackUrl = `${origin}/seller-dashboard?payment=success&reference=${reference}`;
      console.log('🔗 Callback URL:', callbackUrl);

      // Call Paystack API
      console.log('📡 Calling Paystack initialize with amount:', amount * 100, '(kobo/centimes)');

      let paystackResponse: Response;
      try {
        paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${paystackKeys.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            amount: amount * 100,
            reference,
            currency: 'XOF',
            callback_url: callbackUrl,
            metadata: {
              user_id,
              payment_type,
              tokens_amount: tokens_amount || 0,
              recharge_amount: payment_type === 'wallet_recharge' ? amount : undefined,
              product: payment_type === 'wallet_recharge'
                ? `Recharge Compte Djassa ${amount} FCFA`
                : payment_type === 'tokens'
                  ? `Achat de ${tokens_amount} jetons`
                  : 'Premium Seller Access'
            }
          }),
        });
      } catch (fetchErr) {
        console.error('❌ Fetch to Paystack failed:', fetchErr);
        return respond(false, { error: 'Impossible de contacter Paystack. Vérifiez votre connexion.' });
      }

      let paystackData: any;
      try {
        paystackData = await paystackResponse.json();
      } catch {
        console.error('❌ Could not parse Paystack response');
        return respond(false, { error: 'Réponse invalide de Paystack' });
      }

      console.log('📡 Paystack response status:', paystackResponse.status, '| data.status:', paystackData?.status);

      if (!paystackData.status || !paystackData.data?.authorization_url) {
        console.error('❌ Paystack returned error:', JSON.stringify(paystackData));
        return respond(false, { 
          error: paystackData.message || 'Échec de l\'initialisation du paiement Paystack'
        });
      }

      console.log('✅ Paystack initialized successfully. URL:', paystackData.data.authorization_url.substring(0, 50) + '...');

      return respond(true, {
        status: 'success',
        data: {
          authorization_url: paystackData.data.authorization_url,
          access_code: paystackData.data.access_code,
          reference
        }
      });
    }

    // ============================================================
    // ACTION: verify_payment
    // ============================================================
    if (action === 'verify_payment') {
      const { reference } = payload;

      if (!reference || typeof reference !== 'string') {
        return respond(false, { error: 'Référence de paiement manquante' });
      }

      console.log('🔍 Verifying payment:', reference);

      const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { 'Authorization': `Bearer ${paystackKeys.secretKey}` },
      });

      const paystackData = await paystackResponse.json();
      console.log('📡 Verification response status:', paystackData?.data?.status);

      if (!paystackData.status || paystackData.data?.status !== 'success') {
        return respond(false, { error: 'Vérification du paiement échouée', payment_status: paystackData.data?.status });
      }

      const isTestPayment = paystackData.data.domain === 'test';
      console.log(`💳 Payment mode: ${isTestPayment ? 'TEST' : 'LIVE'}`);

      // Get payment record
      const { data: paymentRecord, error: fetchError } = await supabase
        .from('premium_payments')
        .select('*')
        .eq('paystack_reference', reference)
        .single();

      if (fetchError || !paymentRecord) {
        console.error('❌ Payment record not found:', fetchError);
        return respond(false, { error: 'Enregistrement de paiement introuvable' });
      }

      // TEST MODE: no real credits
      if (isTestPayment) {
        await supabase.from('premium_payments')
          .update({ status: 'test_success', payment_date: new Date().toISOString() })
          .eq('paystack_reference', reference);

        return respond(true, {
          test_mode: true,
          message: '🧪 MODE TEST: Paiement simulé réussi. Aucun crédit réel ajouté.',
          data: { reference, amount: paystackData.data.amount / 100, payment_mode: 'test' }
        });
      }

      // LIVE MODE: process real payment
      console.log('💰 LIVE MODE: Processing', paymentRecord.payment_type);
      let updateError;

      if (paymentRecord.payment_type === 'wallet_recharge') {
        const rechargeAmount = paystackData.data.amount / 100;
        await supabase.rpc('initialize_seller_tokens', { _seller_id: paymentRecord.user_id });
        const { error: rpcError } = await supabase.rpc('recharge_wallet', {
          _seller_id: paymentRecord.user_id,
          _amount: rechargeAmount,
          _paystack_reference: reference
        });
        updateError = rpcError;
        if (!updateError) {
          await supabase.from('premium_payments')
            .update({ status: 'completed', payment_date: new Date().toISOString() })
            .eq('paystack_reference', reference);
        }
      } else if (paymentRecord.payment_type === 'tokens') {
        const tokensAmount = paystackData.data.metadata?.tokens_amount || 0;
        await supabase.rpc('initialize_seller_tokens', { _seller_id: paymentRecord.user_id });
        updateError = (await supabase.rpc('add_tokens_after_purchase', {
          _seller_id: paymentRecord.user_id,
          _tokens_amount: tokensAmount,
          _price_paid: paystackData.data.amount / 100,
          _paystack_reference: reference
        })).error;
      } else if (paymentRecord.payment_type === 'article_publication') {
        updateError = (await supabase.rpc('handle_article_payment_success', {
          _user_id: paymentRecord.user_id,
          _paystack_reference: reference,
          _amount: paystackData.data.amount / 100,
          _product_data: paymentRecord.product_data
        })).error;
      } else {
        updateError = (await supabase.rpc('handle_premium_payment_success', {
          _user_id: paymentRecord.user_id,
          _paystack_reference: reference,
          _amount: paystackData.data.amount / 100
        })).error;
      }

      if (updateError) {
        console.error('❌ Processing error:', updateError);
        return respond(false, { error: 'Erreur lors du traitement du paiement' });
      }

      const messageMap: Record<string, string> = {
        wallet_recharge: 'Compte Djassa rechargé avec succès',
        tokens: 'Jetons ajoutés avec succès',
        article_publication: 'Article publié avec succès',
      };

      return respond(true, {
        test_mode: false,
        message: messageMap[paymentRecord.payment_type] || 'Paiement vérifié avec succès',
        data: paystackData.data
      });
    }

    // ============================================================
    // ACTION: verify_order_payment
    // Vérifie un paiement Paystack pour une commande (orders)
    // et marque la commande comme payée si succès.
    // ============================================================
    if (action === 'verify_order_payment') {
      const { reference, order_id } = payload;

      if (!reference || typeof reference !== 'string') {
        return respond(false, { error: 'Référence de paiement manquante' });
      }
      if (!order_id || typeof order_id !== 'string') {
        return respond(false, { error: 'order_id manquant' });
      }

      console.log('🔍 Verifying ORDER payment:', reference, 'for order', order_id);

      // 1. Vérifier le paiement auprès de Paystack
      const paystackResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { 'Authorization': `Bearer ${paystackKeys.secretKey}` } }
      );
      const paystackData = await paystackResponse.json();

      if (!paystackData.status || paystackData.data?.status !== 'success') {
        // Marquer comme failed
        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', order_id);
        return respond(false, { error: 'Paiement non confirmé par Paystack' });
      }

      // 2. Récupérer la commande pour valider le montant
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('id, total_amount, payment_status, payment_method, seller_id, customer_id')
        .eq('id', order_id)
        .single();

      if (orderErr || !order) {
        console.error('❌ Order not found:', orderErr);
        return respond(false, { error: 'Commande introuvable' });
      }

      // Idempotence : si déjà payée, on retourne succès
      if (order.payment_status === 'paid') {
        return respond(true, { message: 'Paiement déjà confirmé', already_paid: true });
      }

      // 3. Vérifier le montant (Paystack en kobo/centimes)
      const paidAmount = (paystackData.data.amount || 0) / 100;
      if (Math.abs(paidAmount - Number(order.total_amount)) > 1) {
        console.error(`❌ Amount mismatch: paid ${paidAmount}, expected ${order.total_amount}`);
        return respond(false, { error: 'Montant payé incohérent' });
      }

      // 4. Marquer la commande comme payée + confirmée
      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          paystack_reference: reference,
          status: 'confirmed',
        })
        .eq('id', order_id);

      if (updateErr) {
        console.error('❌ Order update failed:', updateErr);
        return respond(false, { error: 'Erreur lors de la mise à jour de la commande' });
      }

      console.log('✅ Order marked as paid:', order_id);
      return respond(true, {
        message: 'Paiement confirmé',
        data: { order_id, amount: paidAmount, reference }
      });
    }

    return respond(false, { error: 'Action invalide' });

  } catch (error: unknown) {
    console.error('❌ Unhandled error in paystack-payment:', error);
    return respond(false, { error: error instanceof Error ? error.message : 'Erreur interne du serveur' });
  }
});
