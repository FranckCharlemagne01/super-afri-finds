import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Local storage functions
  const getLocalFavorites = (): string[] => {
    try {
      const localFavorites = localStorage.getItem('djassa_favorites');
      return localFavorites ? JSON.parse(localFavorites) : [];
    } catch {
      return [];
    }
  };

  const setLocalFavorites = (ids: string[]) => {
    localStorage.setItem('djassa_favorites', JSON.stringify(ids));
  };

  const fetchFavorites = async () => {
    if (!user) {
      // Load from localStorage for non-authenticated users
      const localFavorites = getLocalFavorites();
      setFavoriteIds(localFavorites);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavoriteIds(data?.map(fav => fav.product_id) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (productId: string) => {
    const isFavorite = favoriteIds.includes(productId);

    if (!user) {
      // Handle local favorites for non-authenticated users
      const localFavorites = getLocalFavorites();
      
      if (isFavorite) {
        const updatedFavorites = localFavorites.filter(id => id !== productId);
        setLocalFavorites(updatedFavorites);
        setFavoriteIds(updatedFavorites);
        toast({
          title: "Retiré des favoris",
          description: "Le produit a été retiré de vos favoris locaux",
        });
      } else {
        const updatedFavorites = [...localFavorites, productId];
        setLocalFavorites(updatedFavorites);
        setFavoriteIds(updatedFavorites);
        toast({
          title: "Ajouté aux favoris ❤️",
          description: "Le produit a été ajouté à vos favoris",
        });
      }
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;
        
        setFavoriteIds(prev => prev.filter(id => id !== productId));
        toast({
          title: "Retiré des favoris",
          description: "Le produit a été retiré de vos favoris",
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: productId });

        if (error) throw error;
        
        setFavoriteIds(prev => [...prev, productId]);
        toast({
          title: "Ajouté aux favoris ❤️",
          description: "Le produit a été ajouté à vos favoris",
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  return {
    favoriteIds,
    loading,
    toggleFavorite,
    isFavorite: (productId: string) => favoriteIds.includes(productId),
  };
}