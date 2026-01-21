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
    const { phone, otp, fullName, isSignUp } = await req.json();

    // Validation
    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: 'Numéro et code requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanPhone = phone.replace(/[^\d+]/g, '');

    // Initialiser Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Vérifier l'OTP
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('phone_otp')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('otp_code', otp)
      .single();

    if (otpError || !otpRecord) {
      // Incrémenter les tentatives
      await supabaseAdmin
        .from('phone_otp')
        .update({ attempts: (otpRecord?.attempts || 0) + 1 })
        .eq('phone', cleanPhone);

      return new Response(
        JSON.stringify({ error: 'Code invalide ou expiré' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier l'expiration
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Code expiré. Demandez un nouveau code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier les tentatives (max 5)
    if (otpRecord.attempts >= 5) {
      return new Response(
        JSON.stringify({ error: 'Trop de tentatives. Demandez un nouveau code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Marquer l'OTP comme vérifié
    await supabaseAdmin
      .from('phone_otp')
      .update({ verified: true })
      .eq('id', otpRecord.id);

    // Chercher un utilisateur existant avec ce numéro
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email')
      .eq('phone', cleanPhone)
      .single();

    let userId: string;
    let isNewUser = false;

    if (existingProfile?.user_id) {
      // Utilisateur existant - générer un lien de connexion
      userId = existingProfile.user_id;
      
      // Générer un token de session pour cet utilisateur
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: existingProfile.email || `${cleanPhone}@djassa.phone`,
      });

      if (sessionError) {
        console.error('Erreur génération session:', sessionError);
        throw new Error('Erreur de connexion');
      }

      // Supprimer l'OTP utilisé
      await supabaseAdmin
        .from('phone_otp')
        .delete()
        .eq('id', otpRecord.id);

      return new Response(
        JSON.stringify({ 
          success: true,
          isNewUser: false,
          message: 'Connexion réussie',
          magicLink: sessionData?.properties?.action_link
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (isSignUp) {
      // Nouvel utilisateur - créer le compte
      const tempEmail = `${cleanPhone.replace('+', '')}@phone.djassa.ci`;
      const tempPassword = crypto.randomUUID();

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        email_confirm: true,
        phone: cleanPhone,
        phone_confirm: true,
        user_metadata: {
          full_name: fullName || 'Utilisateur Djassa',
          phone: cleanPhone,
          auth_method: 'phone'
        }
      });

      if (createError) {
        console.error('Erreur création utilisateur:', createError);
        throw new Error('Erreur lors de la création du compte');
      }

      userId = newUser.user.id;
      isNewUser = true;

      // Mettre à jour le profil avec le numéro
      await supabaseAdmin
        .from('profiles')
        .update({ phone: cleanPhone })
        .eq('user_id', userId);

      // Générer un lien de connexion
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: tempEmail,
      });

      if (sessionError) {
        console.error('Erreur génération session:', sessionError);
      }

      // Supprimer l'OTP utilisé
      await supabaseAdmin
        .from('phone_otp')
        .delete()
        .eq('id', otpRecord.id);

      return new Response(
        JSON.stringify({ 
          success: true,
          isNewUser: true,
          userId: userId,
          message: 'Compte créé avec succès',
          magicLink: sessionData?.properties?.action_link
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Pas d'utilisateur existant et pas en mode inscription
      return new Response(
        JSON.stringify({ 
          error: 'Aucun compte associé à ce numéro. Veuillez vous inscrire.',
          needsSignUp: true
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    console.error('Erreur verify-otp:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
