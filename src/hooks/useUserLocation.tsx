import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from './useStableAuth';

interface UserLocation {
  city: string | null;
  country: string | null;
  commune: string | null;
}

export const useUserLocation = () => {
  const { user } = useStableAuth();

  const { data: location, isLoading: loading } = useQuery({
    queryKey: ['user-location', user?.id],
    queryFn: async () => {
      if (!user) {
        return { city: null, country: null, commune: null };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('city, country, commune')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user location:', error);
        return { city: null, country: null, commune: null };
      }

      return {
        city: data?.city || null,
        country: data?.country || null,
        commune: data?.commune || null,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return { 
    location: location || { city: null, country: null, commune: null }, 
    loading 
  };
};
