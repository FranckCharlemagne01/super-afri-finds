import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import React from 'npm:react@18.3.1';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { WelcomeEmail } from './_templates/welcome-email.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

// Validate webhook signature to prevent unauthorized calls
const validateWebhookSignature = async (req: Request, payload: string): Promise<boolean> => {
  const signature = req.headers.get('x-webhook-signature');
  const secret = Deno.env.get('SEND_WELCOME_EMAIL_HOOK_SECRET');
  
  // If no signature header is provided, rely on JWT verification (verify_jwt = true)
  if (!signature) {
    console.log('ℹ️ No signature header - relying on JWT verification');
    return true; // JWT verification handles authentication
  }
  
  if (!secret) {
    console.warn('⚠️ SEND_WELCOME_EMAIL_HOOK_SECRET not configured - skipping signature validation');
    return true; // Fall back to JWT verification
  }
  
  try {
    // Generate HMAC-SHA256 signature of the payload
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureData = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    // Convert to hex string
    const calculatedSignature = Array.from(new Uint8Array(signatureData))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Compare signatures (constant-time comparison)
    const providedSignature = signature.toLowerCase();
    
    if (calculatedSignature.length !== providedSignature.length) {
      console.error('❌ Signature length mismatch');
      return false;
    }
    
    let mismatch = 0;
    for (let i = 0; i < calculatedSignature.length; i++) {
      mismatch |= calculatedSignature.charCodeAt(i) ^ providedSignature.charCodeAt(i);
    }
    
    if (mismatch !== 0) {
      console.error('❌ Signature validation failed');
      return false;
    }
    
    console.log('✅ Webhook signature validated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error validating signature:', error);
    return false;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    
    // SECURITY: Validate webhook signature before processing
    const isValid = await validateWebhookSignature(req, payload);
    if (!isValid) {
      console.error('❌ Unauthorized webhook call - invalid or missing signature');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: Invalid webhook signature' 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
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
