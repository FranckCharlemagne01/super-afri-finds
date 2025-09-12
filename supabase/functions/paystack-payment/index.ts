import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response(JSON.stringify({ error: 'Payment service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, ...payload } = await req.json();

    if (action === 'initialize_payment') {
      const { user_id, email, amount = 50000 } = payload; // 500 NGN default
      
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
          currency: 'NGN',
          status: 'pending'
        });

      if (dbError) {
        console.error('Database error:', dbError);
        return new Response(JSON.stringify({ error: 'Failed to create payment record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Initialize payment with Paystack
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amount * 100, // Paystack expects kobo
          reference,
          currency: 'NGN',
          callback_url: `${req.headers.get('origin')}/seller?payment=success&reference=${reference}`,
          metadata: {
            user_id,
            product: 'Premium Seller Access'
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
          'Authorization': `Bearer ${paystackSecretKey}`,
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

      // Update premium status
      const { error: updateError } = await supabase
        .rpc('handle_premium_payment_success', {
          _user_id: paymentRecord.user_id,
          _paystack_reference: reference,
          _amount: paystackData.data.amount / 100 // Convert from kobo
        });

      if (updateError) {
        console.error('Failed to update premium status:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update premium status' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        status: 'success',
        message: 'Payment verified and premium access granted',
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