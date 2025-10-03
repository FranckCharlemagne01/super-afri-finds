import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePaystackPublicKey = () => {
  const [publicKey, setPublicKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        setLoading(true);
        
        // Call the paystack-config function to get the decrypted public key
        const { data, error: functionError } = await supabase.functions.invoke('paystack-config', {
          body: { action: 'get_decrypted_keys' }
        });

        if (functionError) throw functionError;

        if (data.success && data.public_key) {
          setPublicKey(data.public_key);
        } else {
          throw new Error('Failed to fetch Paystack public key');
        }
      } catch (err: any) {
        console.error('Error fetching Paystack public key:', err);
        setError('Veuillez configurer vos clés Paystack dans le super admin');
        setPublicKey('');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicKey();
  }, []);

  return { publicKey, loading, error };
};
