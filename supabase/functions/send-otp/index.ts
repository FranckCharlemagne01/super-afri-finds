import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    // Validation du numéro de téléphone
    if (!phone || phone.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Numéro de téléphone invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Nettoyer le numéro (garder uniquement les chiffres et le +)
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Générer un OTP à 6 chiffres
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Initialiser Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // SECURITY: Rate limiting - max 5 OTP requests per hour per phone number
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentOtps, error: countError } = await supabaseAdmin
      .from('phone_otp')
      .select('id, created_at')
      .eq('phone', cleanPhone)
      .gte('created_at', oneHourAgo);

    if (countError) {
      console.error('Erreur vérification rate limit:', countError);
    }

    if (recentOtps && recentOtps.length >= 5) {
      return new Response(
        JSON.stringify({ error: 'Trop de tentatives. Réessayez dans 1 heure.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Supprimer les anciens OTP pour ce numéro (keep for rate limiting check, only delete expired ones)
    await supabaseAdmin
      .from('phone_otp')
      .delete()
      .eq('phone', cleanPhone)
      .lt('expires_at', new Date().toISOString());

    // Stocker le nouvel OTP
    const { error: insertError } = await supabaseAdmin
      .from('phone_otp')
      .insert({
        phone: cleanPhone,
        otp_code: otpCode,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      });

    if (insertError) {
      console.error('Erreur insertion OTP:', insertError);
      throw new Error('Erreur lors de la création du code');
    }

    // Envoyer le SMS via Termii
    const termiiApiKey = Deno.env.get('TERMII_API_KEY');
    const termiiSenderId = Deno.env.get('TERMII_SENDER_ID') || 'Djassa';

    if (!termiiApiKey) {
      console.error('TERMII_API_KEY not configured - SMS service unavailable');
      // Log OTP for server-side debugging only (visible in edge function logs)
      console.log('DEBUG OTP (server logs only):', otpCode);
      return new Response(
        JSON.stringify({ 
          error: 'Service SMS temporairement indisponible. Veuillez réessayer plus tard.' 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const termiiResponse = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: termiiApiKey,
        to: cleanPhone,
        from: termiiSenderId,
        sms: `Votre code Djassa est: ${otpCode}. Valable 5 minutes.`,
        type: 'plain',
        channel: 'generic',
      }),
    });

    const termiiData = await termiiResponse.json();
    console.log('Réponse Termii:', termiiData);

    if (!termiiResponse.ok || termiiData.code !== 'ok') {
      console.error('Erreur Termii:', termiiData);
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors de l\'envoi du SMS. Veuillez réessayer.',
          details: termiiData.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Code envoyé par SMS' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur send-otp:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
