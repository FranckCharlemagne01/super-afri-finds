-- Créer une fonction sécurisée pour l'annulation de commandes par l'acheteur
CREATE OR REPLACE FUNCTION public.cancel_order_by_customer(order_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record RECORD;
  result json;
BEGIN
  -- Vérifier que l'utilisateur est connecté
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Récupérer les informations de la commande
  SELECT * INTO order_record
  FROM orders
  WHERE id = order_id;
  
  -- Vérifier que la commande existe
  IF order_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Commande introuvable'
    );
  END IF;
  
  -- Vérifier que l'utilisateur est bien le client de cette commande
  IF order_record.customer_id != auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous ne pouvez annuler que vos propres commandes'
    );
  END IF;
  
  -- Vérifier que la commande peut être annulée (pas déjà expédiée ou livrée)
  IF order_record.status IN ('shipped', 'delivered') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cette commande ne peut plus être annulée car elle a déjà été expédiée ou livrée'
    );
  END IF;
  
  -- Vérifier que la commande n'est pas déjà annulée
  IF order_record.status = 'cancelled' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cette commande est déjà annulée'
    );
  END IF;
  
  -- Mettre à jour le statut de la commande
  UPDATE orders 
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE id = order_id;
  
  -- Retourner le succès avec les informations du vendeur pour notification
  RETURN json_build_object(
    'success', true,
    'seller_id', order_record.seller_id,
    'product_title', order_record.product_title,
    'customer_name', order_record.customer_name
  );
END;
$$;