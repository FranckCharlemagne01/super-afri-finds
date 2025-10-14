import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import React from 'npm:react@18.3.1';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { WelcomeEmail } from './_templates/welcome-email.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const hookSecret = Deno.env.get('SEND_WELCOME_EMAIL_HOOK_SECRET') as string;

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
    const headers = Object.fromEntries(req.headers);
    
    // SECURITY: Vérifier que le secret du webhook est configuré
    if (!hookSecret) {
      console.error('SEND_WELCOME_EMAIL_HOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // SECURITY: Vérifier l'authentification du Auth Hook
    const authHeader = headers['authorization'];
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Support both "Bearer <secret>" and direct "<secret>" formats
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', '') 
      : authHeader;
    
    if (token !== hookSecret) {
      console.error('Invalid hook secret. Expected format: v1,whsec_...');
      return new Response(
        JSON.stringify({ error: 'Invalid hook secret' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Parser le payload du webhook
    const webhookData = JSON.parse(payload) as {
      user: {
        email: string;
        user_metadata?: {
          full_name?: string;
        };
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };
    
    const user = webhookData.user;
    const emailData = webhookData.email_data;

    console.log('Sending welcome email to:', user.email);

    // Extraire le prénom depuis le nom complet
    const fullName = user.user_metadata?.full_name || 'utilisateur';
    const firstName = fullName.split(' ')[0];

    // Construire l'URL de confirmation
    const confirmationUrl = `${Deno.env.get('SUPABASE_URL') || 'https://zqskpspbyzptzjcoitwt.supabase.co'}/auth/v1/verify?token=${emailData.token_hash}&type=${emailData.email_action_type}&redirect_to=${emailData.redirect_to}`;

    // Générer le HTML de l'email avec React Email
    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        firstName,
        confirmationUrl,
      })
    );

    // Envoyer l'email via Resend
    const { error } = await resend.emails.send({
      from: 'Djassa <contact@djassa.tech>',
      to: [user.email],
      subject: '🎉 Bienvenue sur Djassa – Confirmez votre adresse e-mail',
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    console.log('Welcome email sent successfully to:', user.email);

    return new Response(
      JSON.stringify({ success: true, message: 'Welcome email sent successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-welcome-email function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
