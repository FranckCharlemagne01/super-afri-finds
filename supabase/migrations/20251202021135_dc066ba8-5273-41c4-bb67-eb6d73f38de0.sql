-- Corriger l'erreur "could not parse JSON in the RAISE SQLSTATE 'PGRST' error"
-- en remplaçant l'usage de ERRCODE = 'PGRST' par des exceptions classiques,
-- sans modifier la logique métier.

-- 1) Fonction utilisée par le vendeur pour changer le statut d'une commande
--    (confirmée, expédiée, livrée, annulée)
CREATE OR REPLACE FUNCTION public.update_order_status(order_id uuid, new_status text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  order_seller_id UUID;
  current_user_id UUID;
  is_superadmin BOOLEAN;
BEGIN
  -- SECURITY: Verify authentication
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- SECURITY: Input validation to prevent injection attacks
  IF new_status NOT IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;
  
  -- SECURITY: Validate order exists and get seller_id
  SELECT seller_id INTO order_seller_id
  FROM orders
  WHERE id = order_id;
  
  IF order_seller_id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- SECURITY: Check authorization - only seller or superadmin can update
  is_superadmin := has_role(current_user_id, 'superadmin'::user_role);
  
  IF order_seller_id != current_user_id AND NOT is_superadmin THEN
    RAISE EXCEPTION 'Unauthorized: You can only update your own orders';
  END IF;
  
  -- Update order status
  UPDATE orders 
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = order_id;
  
  -- SECURITY: Log this status change
  INSERT INTO public.order_access_logs (
    order_id,
    accessed_by,
    access_type,
    accessed_at
  ) VALUES (
    order_id,
    current_user_id,
    'status_update_' || new_status,
    now()
  );
  
  RETURN TRUE;
END;
$function$;

-- Remarque :
-- Les autres fonctions liées aux commandes (confirm_sale_by_seller, cancel_order_by_customer, get_order_details,
-- get_seller_orders, etc.) ne renvoient déjà que du JSON via json_build_object ou utilisent des RAISE EXCEPTION
-- classiques, sans SQLSTATE personnalisé. La seule fonction bloquante pour les actions vendeur
-- était update_order_status qui utilisait ERRCODE = 'PGRST'.
