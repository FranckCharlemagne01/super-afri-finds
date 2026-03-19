import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    // Validation email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Adresse email invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Rate limiting: max 5 OTP par heure par email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentOtps } = await supabaseAdmin
      .from('email_otp')
      .select('id')
      .eq('email', cleanEmail)
      .gte('created_at', oneHourAgo);

    if (recentOtps && recentOtps.length >= 5) {
      return new Response(
        JSON.stringify({ error: 'Trop de tentatives. Réessayez dans 1 heure.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Supprimer les anciens OTP expirés
    await supabaseAdmin
      .from('email_otp')
      .delete()
      .eq('email', cleanEmail)
      .lt('expires_at', new Date().toISOString());

    // Générer OTP 6 chiffres
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Stocker l'OTP
    const { error: insertError } = await supabaseAdmin
      .from('email_otp')
      .insert({
        email: cleanEmail,
        otp_code: otpCode,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      console.error('Erreur insertion OTP:', insertError);
      throw new Error('Erreur lors de la création du code');
    }

    // Envoyer via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Service email temporairement indisponible.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Djassa <noreply@mail.djassa.tech>',
        to: [cleanEmail],
        subject: 'Code de vérification Djassa',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #F97316; font-size: 24px; margin: 0;">Djassa</h1>
            </div>
            <h2 style="color: #111827; font-size: 20px; text-align: center; margin-bottom: 8px;">
              Code de vérification
            </h2>
            <p style="color: #6b7280; text-align: center; margin-bottom: 24px;">
              Utilisez le code ci-dessous pour vous connecter à Djassa.
            </p>
            <div style="background: #FFF7ED; border: 2px solid #F97316; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #F97316;">
                ${otpCode}
              </span>
            </div>
            <p style="color: #9ca3af; font-size: 14px; text-align: center;">
              Ce code expire dans <strong>5 minutes</strong>.
            </p>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
              Si vous n'avez pas demandé ce code, ignorez cet email.
            </p>
          </div>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error('Erreur Resend:', resendError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'envoi de l'email. Veuillez réessayer." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Code envoyé par email' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erreur send-email-otp:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
