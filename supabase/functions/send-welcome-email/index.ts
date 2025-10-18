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

    // Générer un token de vérification unique
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Sauvegarder le token dans la base de données
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zqskpspbyzptzjcoitwt.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        email_verification_token: verificationToken,
        email_verification_expires_at: expiresAt.toISOString(),
      })
    });

    if (!updateResponse.ok) {
      console.error('❌ Failed to save verification token');
    }

    // Construire l'URL de vérification avec le callback Supabase
    const verificationUrl = `https://zqskpspbyzptzjcoitwt.supabase.co/auth/v1/verify?token=${verificationToken}&type=email&redirect_to=https://djassa.djassa.tech/auth/callback`;

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
