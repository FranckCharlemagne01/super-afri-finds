import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AES-256-GCM encryption/decryption utilities
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get('ENCRYPTION_KEY');
  if (!keyString) {
    throw new Error('ENCRYPTION_KEY not configured');
  }
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString.padEnd(32, '0').slice(0, 32));
  
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(encryptedBase64: string): Promise<string> {
  const key = await getEncryptionKey();
  
  // Decode base64
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Validate Paystack key by calling their API
async function validatePaystackKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.paystack.co/transaction', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      return { valid: false, error: 'Clé Paystack invalide. Veuillez vérifier votre clé secrète.' };
    }

    if (response.status === 200) {
      return { valid: true };
    }

    return { valid: false, error: 'Impossible de valider la clé Paystack. Veuillez réessayer.' };
  } catch (error) {
    console.error('Error validating Paystack key:', error);
    return { valid: false, error: 'Erreur de connexion à Paystack. Veuillez réessayer.' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      throw new Error('Unauthorized');
    }

    const { action, secret_key_test, public_key_test, secret_key_live, public_key_live, mode } = await req.json();
    console.log('Paystack config action:', action, 'for user:', user.id);

    // For save and get actions, verify user is superadmin
    if (action === 'save' || action === 'get') {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'superadmin')
        .maybeSingle();

      if (roleError || !roleData) {
        console.error('Superadmin check failed:', roleError);
        throw new Error('Forbidden: Superadmin access required');
      }
    }

    if (action === 'save') {
      // Validate keys before encrypting and saving
      if (secret_key_test) {
        const validation = await validatePaystackKey(secret_key_test);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: validation.error || 'Votre clé secrète Paystack Test n\'est pas valide. Merci d\'entrer une clé valide.' 
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      if (secret_key_live) {
        const validation = await validatePaystackKey(secret_key_live);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: validation.error || 'Votre clé secrète Paystack Live n\'est pas valide. Merci d\'entrer une clé valide.' 
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      // Encrypt keys if provided
      const encryptedSecretKeyTest = secret_key_test ? await encryptData(secret_key_test) : null;
      const encryptedPublicKeyTest = public_key_test ? await encryptData(public_key_test) : null;
      const encryptedSecretKeyLive = secret_key_live ? await encryptData(secret_key_live) : null;
      const encryptedPublicKeyLive = public_key_live ? await encryptData(public_key_live) : null;

      // Get existing config
      const { data: existingConfig } = await supabase
        .from('paystack_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      const updateData: any = { mode };
      if (encryptedSecretKeyTest) updateData.encrypted_key_test = encryptedSecretKeyTest;
      if (encryptedPublicKeyTest) updateData.encrypted_public_key_test = encryptedPublicKeyTest;
      if (encryptedSecretKeyLive) updateData.encrypted_key_live = encryptedSecretKeyLive;
      if (encryptedPublicKeyLive) updateData.encrypted_public_key_live = encryptedPublicKeyLive;

      if (existingConfig) {
        // Update existing config
        const { error: updateError } = await supabase
          .from('paystack_config')
          .update(updateData)
          .eq('id', existingConfig.id);

        if (updateError) throw updateError;
      } else {
        // Insert new config
        const { error: insertError } = await supabase
          .from('paystack_config')
          .insert(updateData);

        if (insertError) throw insertError;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Configuration Paystack mise à jour avec succès' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get') {
      // Get config
      const { data: config, error: configError } = await supabase
        .from('paystack_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (configError) throw configError;

      return new Response(
        JSON.stringify({
          success: true,
          mode: config?.mode || 'test',
          has_test_keys: !!(config?.encrypted_key_test && config?.encrypted_public_key_test),
          has_live_keys: !!(config?.encrypted_key_live && config?.encrypted_public_key_live),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_decrypted_keys') {
      // Get the appropriate keys based on current mode
      // This action is accessible to all authenticated users (they need public key for payments)
      const { data: config, error: configError } = await supabase
        .from('paystack_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (configError) {
        console.error('Error fetching config:', configError);
        throw configError;
      }
      
      if (!config) {
        console.error('No Paystack configuration found in database');
        throw new Error('Paystack configuration not found. Please configure Paystack keys in the super admin panel.');
      }

      console.log('Config mode:', config.mode);

      const encryptedSecretKey = config.mode === 'test' 
        ? config.encrypted_key_test 
        : config.encrypted_key_live;

      const encryptedPublicKey = config.mode === 'test'
        ? config.encrypted_public_key_test
        : config.encrypted_public_key_live;

      if (!encryptedPublicKey) {
        console.error(`No ${config.mode} public key configured`);
        throw new Error(`No ${config.mode} public key configured. Please add Paystack keys in the super admin panel.`);
      }

      if (!encryptedSecretKey) {
        console.error(`No ${config.mode} secret key configured`);
        throw new Error(`No ${config.mode} secret key configured. Please add Paystack keys in the super admin panel.`);
      }

      const decryptedPublicKey = await decryptData(encryptedPublicKey);
      console.log('Successfully decrypted public key, starts with:', decryptedPublicKey.substring(0, 7));

      // Only return public key to regular users
      // Secret key is only used server-side in paystack-payment function
      return new Response(
        JSON.stringify({ 
          success: true, 
          public_key: decryptedPublicKey,
          mode: config.mode 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error: unknown) {
    console.error('Error in paystack-config function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
