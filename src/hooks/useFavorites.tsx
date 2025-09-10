import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFavorites = async () => {
    if (!user) return;
    
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
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour ajouter des favoris",
        variant: "destructive",
      });
      return;
    }

    const isFavorite = favoriteIds.includes(productId);

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
          title: "Ajouté aux favoris",
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
    if (user) {
      fetchFavorites();
    } else {
      setFavoriteIds([]);
    }
  }, [user]);

  return {
    favoriteIds,
    loading,
    toggleFavorite,
    isFavorite: (productId: string) => favoriteIds.includes(productId),
  };
}