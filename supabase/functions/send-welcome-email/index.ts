import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import React from 'npm:react@18.3.1';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { WelcomeEmail } from './_templates/welcome-email.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    
    console.log('✓ Auth Hook received - Processing welcome email');
    console.log('📦 Payload received:', payload);
    
    // Vérifier que le payload n'est pas vide
    if (!payload || payload.trim() === '') {
      console.error('❌ Empty payload received');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Empty payload received from Auth Hook' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Parser le payload JSON des Auth Hooks Supabase
    const webhookData = JSON.parse(payload) as {
      type: string;
      user: {
        id: string;
        email: string;
        user_metadata?: {
          full_name?: string;
        };
      };
    };
    
    const user = webhookData.user;
    const userId = user.id;

    console.log('✓ Processing email for user_id:', userId || 'unknown');

    // Extraire le prénom depuis le nom complet
    const fullName = user.user_metadata?.full_name || 'utilisateur';
    const firstName = fullName.split(' ')[0];

    // Créer un client Supabase admin pour générer le lien de vérification
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zqskpspbyzptzjcoitwt.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.4');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Générer un lien de vérification Supabase natif
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: user.email,
      options: {
        redirectTo: 'https://djassa.djassa.tech/auth/callback'
      }
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('❌ Failed to generate verification link:', linkError);
      throw new Error('Failed to generate verification link');
    }

    const verificationUrl = linkData.properties.action_link;

    // Générer le HTML de l'email avec React Email
    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        firstName,
        verificationUrl,
      })
    );

    // Envoyer l'email via Resend
    const { error } = await resend.emails.send({
      from: 'Djassa <noreply@djassa.tech>',
      to: [user.email],
      subject: 'Vérifiez votre compte Djassa',
      html,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      // Ne pas bloquer l'inscription si l'email échoue
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User created successfully, but email sending failed',
          emailError: error.message 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Email envoyé avec succès à:', user.email);

    return new Response(
      JSON.stringify({ success: true, message: 'Welcome email sent successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in send-welcome-email function:', error);
    // Toujours retourner 200 pour ne pas bloquer l'inscription
    return new Response(
      JSON.stringify({
        success: true,
        message: 'User created successfully, but email sending encountered an error',
        error: error.message,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
