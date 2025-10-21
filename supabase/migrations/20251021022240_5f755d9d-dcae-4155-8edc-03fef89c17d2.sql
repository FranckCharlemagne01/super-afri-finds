-- Ajouter le champ de confirmation vendeur dans la table orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_confirmed_by_seller boolean DEFAULT false;

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_orders_confirmed_by_seller 
ON public.orders(is_confirmed_by_seller, seller_id);

-- Fonction pour confirmer la vente par le vendeur
CREATE OR REPLACE FUNCTION public.confirm_sale_by_seller(
  _order_id uuid,
  _mark_product_as_sold boolean DEFAULT true
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  order_record RECORD;
  current_user_id uuid;
BEGIN
  -- Vérifier l'authentification
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;
  
  -- Récupérer la commande
  SELECT * INTO order_record
  FROM orders
  WHERE id = _order_id;
  
  -- Vérifier que la commande existe
  IF order_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Commande introuvable'
    );
  END IF;
  
  -- Vérifier que c'est bien le vendeur
  IF order_record.seller_id != current_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous ne pouvez confirmer que vos propres ventes'
    );
  END IF;
  
  -- Vérifier que la commande est livrée
  IF order_record.status != 'delivered' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'La commande doit être livrée avant confirmation'
    );
  END IF;
  
  -- Vérifier que la vente n'est pas déjà confirmée
  IF order_record.is_confirmed_by_seller = true THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cette vente a déjà été confirmée'
    );
  END IF;
  
  -- Confirmer la vente
  UPDATE orders
  SET is_confirmed_by_seller = true,
      updated_at = now()
  WHERE id = _order_id;
  
  -- Marquer le produit comme vendu si demandé
  IF _mark_product_as_sold = true THEN
    UPDATE products
    SET is_sold = true,
        is_active = false,
        updated_at = now()
    WHERE id = order_record.product_id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Vente confirmée avec succès',
    'order_id', _order_id,
    'product_marked_sold', _mark_product_as_sold
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Commentaire pour documenter la fonction
COMMENT ON FUNCTION public.confirm_sale_by_seller IS 
'Permet au vendeur de confirmer manuellement une vente après livraison. Marque optionnellement le produit comme vendu.';