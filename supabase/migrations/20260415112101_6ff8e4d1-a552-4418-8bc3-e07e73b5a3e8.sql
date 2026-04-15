
-- 1. ACTIVER RLS sur publication_bonuses (seule table sans RLS)
ALTER TABLE public.publication_bonuses ENABLE ROW LEVEL SECURITY;

-- Politique : les vendeurs voient leurs propres bonus
CREATE POLICY "Sellers can view their own publication bonuses"
  ON public.publication_bonuses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Politique : seuls les superadmins peuvent tout gérer
CREATE POLICY "Superadmins can manage all publication bonuses"
  ON public.publication_bonuses
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'::user_role));

-- 2. CORRIGER la politique UPDATE cassée sur orders
-- La subquery WHERE orders_1.id = orders_1.id est toujours vraie (self-referential)
DROP POLICY IF EXISTS "Customers can update their own orders" ON public.orders;

CREATE POLICY "Customers can update their own orders"
  ON public.orders
  FOR UPDATE
  USING (auth.uid() = customer_id AND auth.uid() IS NOT NULL)
  WITH CHECK (
    auth.uid() = customer_id
    AND auth.uid() IS NOT NULL
    AND status IN ('pending', 'cancelled')
  );

-- 3. SUPPRIMER les politiques de stockage trop permissives
-- Ces politiques permettent à n'importe quel utilisateur authentifié de manipuler les images des autres
DROP POLICY IF EXISTS "Users can delete their product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
