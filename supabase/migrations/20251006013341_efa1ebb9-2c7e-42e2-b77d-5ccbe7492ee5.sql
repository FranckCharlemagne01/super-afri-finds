-- Mettre à jour la politique RLS pour les produits afin de vérifier les jetons
DROP POLICY IF EXISTS "Sellers can insert products during trial or premium" ON public.products;

-- Nouvelle politique basée sur les jetons disponibles
CREATE POLICY "Sellers can insert products with tokens"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = seller_id 
  AND EXISTS (
    SELECT 1 FROM public.seller_tokens 
    WHERE seller_id = auth.uid() 
    AND token_balance > 0
  )
);