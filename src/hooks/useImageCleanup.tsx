import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour signaler et nettoyer automatiquement les images cassées
 */
export const useImageCleanup = () => {
  /**
   * Signale une image cassée et la supprime de la base de données
   */
  const reportBrokenImage = useCallback(async (
    productId: string,
    brokenImageUrl: string
  ): Promise<boolean> => {
    try {
      // 1. Récupérer les images actuelles du produit
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('images')
        .eq('id', productId)
        .single();

      if (fetchError || !product) {
        console.error('Failed to fetch product for image cleanup:', fetchError);
        return false;
      }

      // 2. Filtrer l'image cassée
      const currentImages = product.images || [];
      const cleanedImages = currentImages.filter(
        (img: string) => img !== brokenImageUrl && !brokenImageUrl.includes(img)
      );

      // 3. Mettre à jour si des images ont été retirées
      if (cleanedImages.length !== currentImages.length) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            images: cleanedImages,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        if (updateError) {
          console.error('Failed to update product images:', updateError);
          return false;
        }

        console.log(`Removed broken image from product ${productId}`);

        // 4. Essayer de supprimer du storage si c'est une URL Supabase
        if (brokenImageUrl.includes('supabase.co/storage')) {
          const pathMatch = brokenImageUrl.match(/\/product-images\/(.+)$/);
          if (pathMatch) {
            const filePath = pathMatch[1];
            await supabase.storage
              .from('product-images')
              .remove([filePath]);
          }
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in reportBrokenImage:', error);
      return false;
    }
  }, []);

  /**
   * Valide si une URL d'image est accessible
   */
  const validateImageUrl = useCallback(async (url: string): Promise<boolean> => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return false;
    }

    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  /**
   * Lance le nettoyage complet via l'edge function
   */
  const runFullCleanup = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-broken-images');
      
      if (error) {
        console.error('Cleanup function error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to run cleanup:', error);
      return null;
    }
  }, []);

  return {
    reportBrokenImage,
    validateImageUrl,
    runFullCleanup
  };
};

export default useImageCleanup;
