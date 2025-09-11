-- Créer une fonction sécurisée pour récupérer les commandes avec données masquées pour les vendeurs
CREATE OR REPLACE FUNCTION public.get_seller_orders()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  product_title TEXT,
  product_price NUMERIC,
  quantity INTEGER,
  total_amount NUMERIC,
  status TEXT,
  seller_id UUID,
  customer_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_location TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est connecté
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
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
    END::TEXT as customer_name,
    CASE 
      WHEN auth.uid() = o.customer_id THEN o.customer_phone
      WHEN auth.uid() = o.seller_id THEN 
        CASE 
          WHEN o.customer_phone IS NOT NULL 
          THEN LEFT(o.customer_phone, 3) || '***' || RIGHT(o.customer_phone, 2)
          ELSE 'Téléphone masqué'
        END
      ELSE 'Confidentiel'
    END::TEXT as customer_phone,
    CASE 
      WHEN auth.uid() = o.customer_id THEN o.delivery_location
      WHEN auth.uid() = o.seller_id THEN 
        CASE 
          WHEN o.delivery_location IS NOT NULL 
          THEN LEFT(o.delivery_location, 10) || '...'
          ELSE 'Adresse masquée'
        END
      ELSE 'Confidentiel'
    END::TEXT as delivery_location
  FROM public.orders o
  WHERE 
    auth.uid() = o.customer_id 
    OR auth.uid() = o.seller_id 
    OR has_role(auth.uid(), 'superadmin'::user_role);
END;
$$;

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

-- Modifier les politiques RLS existantes pour restreindre l'accès direct des vendeurs
DROP POLICY IF EXISTS "Sellers can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update their orders" ON public.orders;

-- Conserver les politiques pour les clients et superadmins
-- (ces politiques existent déjà, on les recrée pour être sûr)
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders for themselves" ON public.orders;
DROP POLICY IF EXISTS "Superadmins can manage all orders" ON public.orders;

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

-- Note: Les vendeurs devront maintenant utiliser la fonction get_seller_orders() 
-- pour voir leurs commandes avec des données client masquées,
-- et la fonction update_order_status() pour mettre à jour le statut