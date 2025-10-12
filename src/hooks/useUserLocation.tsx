import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from './useStableAuth';

interface UserLocation {
  city: string | null;
  country: string | null;
}

export const useUserLocation = () => {
  const { user } = useStableAuth();
  const [location, setLocation] = useState<UserLocation>({
    city: null,
    country: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserLocation = async () => {
      if (!user) {
        setLocation({ city: null, country: null });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('city, country')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user location:', error);
          setLocation({ city: null, country: null });
        } else {
          setLocation({
            city: data?.city || null,
            country: data?.country || null,
          });
        }
      } catch (error) {
        console.error('Error fetching user location:', error);
        setLocation({ city: null, country: null });
      } finally {
        setLoading(false);
      }
    };

    fetchUserLocation();
  }, [user]);

  return { location, loading };
};
