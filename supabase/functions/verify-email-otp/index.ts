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
    const { email, otp, fullName } = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: 'Email et code requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Chercher l'OTP
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('email_otp')
      .select('*')
      .eq('email', cleanEmail)
      .eq('otp_code', otp)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      // Incrémenter tentatives sur le dernier OTP non vérifié
      const { data: latestOtp } = await supabaseAdmin
        .from('email_otp')
        .select('id, attempts')
        .eq('email', cleanEmail)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestOtp) {
        await supabaseAdmin
          .from('email_otp')
          .update({ attempts: latestOtp.attempts + 1 })
          .eq('id', latestOtp.id);
      }

      return new Response(
        JSON.stringify({ error: 'Code invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier expiration
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Code expiré. Demandez un nouveau code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier tentatives (max 5)
    if (otpRecord.attempts >= 5) {
      return new Response(
        JSON.stringify({ error: 'Trop de tentatives. Demandez un nouveau code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Marquer comme vérifié
    await supabaseAdmin
      .from('email_otp')
      .update({ verified: true })
      .eq('id', otpRecord.id);

    // Chercher un utilisateur existant
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (existingUser) {
      // Utilisateur existant → générer magic link
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: cleanEmail,
      });

      if (linkError) {
        console.error('Erreur génération lien:', linkError);
        throw new Error('Erreur de connexion');
      }

      // Nettoyer les OTPs
      await supabaseAdmin
        .from('email_otp')
        .delete()
        .eq('email', cleanEmail);

      return new Response(
        JSON.stringify({
          success: true,
          isNewUser: false,
          message: 'Connexion réussie',
          magicLink: linkData?.properties?.action_link,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Nouvel utilisateur → créer le compte
      const tempPassword = crypto.randomUUID();

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || 'Utilisateur Djassa',
          auth_method: 'email_otp',
        },
      });

      if (createError) {
        console.error('Erreur création utilisateur:', createError);
        throw new Error('Erreur lors de la création du compte');
      }

      // Générer magic link
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: cleanEmail,
      });

      if (linkError) {
        console.error('Erreur génération lien:', linkError);
      }

      // Nettoyer les OTPs
      await supabaseAdmin
        .from('email_otp')
        .delete()
        .eq('email', cleanEmail);

      return new Response(
        JSON.stringify({
          success: true,
          isNewUser: true,
          userId: newUser.user.id,
          message: 'Compte créé avec succès',
          magicLink: linkData?.properties?.action_link,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    console.error('Erreur verify-email-otp:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
