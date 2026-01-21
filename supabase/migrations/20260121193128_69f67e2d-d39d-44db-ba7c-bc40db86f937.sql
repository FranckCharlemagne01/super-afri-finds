-- RESTAURATION DE LA VISIBILITÉ DES PRODUITS
-- Le problème : products_public utilise security_invoker=on, donc hérite les RLS de products
-- Les RLS actuelles de products n'autorisent que les propriétaires à voir leurs produits
-- Solution : Ajouter une policy SELECT publique pour les produits actifs

-- 1. Ajouter une policy pour permettre à TOUS de voir les produits actifs avec images
CREATE POLICY "Anyone can view active products with images" 
ON public.products 
FOR SELECT 
USING (
  is_active = true 
  AND images IS NOT NULL 
  AND array_length(images, 1) > 0
);

-- 2. Vérifier que shops_public a aussi une policy de lecture publique
-- (la vue shops_public doit aussi être accessible)
-- Recréer la vue shops_public avec les bonnes permissions si nécessaire
DROP VIEW IF EXISTS public.shops_public;

CREATE VIEW public.shops_public
WITH (security_invoker = off) AS
SELECT 
  id,
  shop_name,
  shop_slug,
  shop_description,
  logo_url,
  banner_url,
  created_at,
  updated_at
FROM public.seller_shops
WHERE is_active = true;

-- 3. Accorder les permissions sur la vue
GRANT SELECT ON public.shops_public TO anon, authenticated;

-- 4. Recréer products_public sans security_invoker pour accès public direct
DROP VIEW IF EXISTS public.products_public;

CREATE VIEW public.products_public
WITH (security_invoker = off) AS
SELECT 
  p.id,
  p.title,
  p.description,
  p.price,
  p.category,
  p.images,
  p.badge,
  p.video_url,
  p.city,
  p.country,
  p.discount_percentage,
  p.is_flash_sale,
  p.is_boosted,
  p.boosted_at,
  p.boosted_until,
  p.rating,
  p.reviews_count,
  p.shop_id,
  p.created_at,
  p.updated_at,
  CASE WHEN p.stock_quantity > 0 THEN true ELSE false END as in_stock
FROM public.products p
WHERE p.is_active = true 
  AND p.images IS NOT NULL 
  AND array_length(p.images, 1) > 0;

-- 5. Accorder les permissions sur products_public
GRANT SELECT ON public.products_public TO anon, authenticated;