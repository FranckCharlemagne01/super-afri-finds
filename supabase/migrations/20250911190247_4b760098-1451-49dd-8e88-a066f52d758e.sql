-- Créer une vue pour les vendeurs qui masque les informations sensibles des clients
CREATE OR REPLACE VIEW public.seller_orders_view AS
SELECT 
  o.id,
  o.product_id,
  o.product_title,
  o.product_price,
  o.quantity,
  o.total_amount,
  o.status,
  o.seller_id,
  o.customer_id,
  o.created_at,
  o.updated_at,
  -- Masquer partiellement les informations sensibles pour les vendeurs
  CASE 
    WHEN auth.uid() = o.customer_id THEN o.customer_name
    WHEN auth.uid() = o.seller_id THEN 
      CASE 
        WHEN o.customer_name IS NOT NULL 
        THEN LEFT(o.customer_name, 1) || '***' || RIGHT(o.customer_name, 1)
        ELSE 'Client anonyme'
      END
    ELSE 'Confidentiel'
  END as customer_name,
  CASE 
    WHEN auth.uid() = o.customer_id THEN o.customer_phone
    WHEN auth.uid() = o.seller_id THEN 
      CASE 
        WHEN o.customer_phone IS NOT NULL 
        THEN LEFT(o.customer_phone, 3) || '***' || RIGHT(o.customer_phone, 2)
        ELSE 'Téléphone masqué'
      END
    ELSE 'Confidentiel'
  END as customer_phone,
  CASE 
    WHEN auth.uid() = o.customer_id THEN o.delivery_location
    WHEN auth.uid() = o.seller_id THEN 
      CASE 
        WHEN o.delivery_location IS NOT NULL 
        THEN LEFT(o.delivery_location, 10) || '...'
        ELSE 'Adresse masquée'
      END
    ELSE 'Confidentiel'
  END as delivery_location
FROM public.orders o;

-- Activer RLS sur la vue
ALTER VIEW public.seller_orders_view SET (security_barrier = true);

-- Créer des politiques RLS pour la vue
CREATE POLICY "Users can view orders through secure view"
ON public.seller_orders_view
FOR SELECT
USING (
  auth.uid() = customer_id 
  OR auth.uid() = seller_id 
  OR has_role(auth.uid(), 'superadmin'::user_role)
);

-- Créer une fonction sécurisée pour que les vendeurs mettent à jour le statut des commandes
CREATE OR REPLACE FUNCTION public.update_order_status(
  order_id UUID,
  new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_seller_id UUID;
BEGIN
  -- Vérifier que l'utilisateur est connecté
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Récupérer le seller_id de la commande
  SELECT seller_id INTO order_seller_id
  FROM orders
  WHERE id = order_id;
  
  -- Vérifier que l'utilisateur est le vendeur de cette commande ou un superadmin
  IF order_seller_id != auth.uid() AND NOT has_role(auth.uid(), 'superadmin'::user_role) THEN
    RAISE EXCEPTION 'Unauthorized: You can only update your own orders';
  END IF;
  
  -- Valider le statut
  IF new_status NOT IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;
  
  -- Mettre à jour uniquement le statut
  UPDATE orders 
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = order_id;
  
  RETURN TRUE;
END;
$$;

-- Révoquer l'accès direct à la table orders pour les vendeurs (sauf superadmins)
DROP POLICY IF EXISTS "Sellers can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update their orders" ON public.orders;

-- Créer de nouvelles politiques plus strictes
CREATE POLICY "Customers can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = customer_id);

CREATE POLICY "Users can create orders for themselves"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Superadmins can manage all orders"
ON public.orders
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::user_role));

-- Les vendeurs ne peuvent plus accéder directement à la table orders
-- Ils doivent utiliser la vue seller_orders_view et la fonction update_order_status