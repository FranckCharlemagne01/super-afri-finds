-- Ajouter les colonnes city et country à la table products pour le filtrage géographique
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'CI';

-- Créer un index pour optimiser les requêtes de filtrage par ville et pays
CREATE INDEX IF NOT EXISTS idx_products_city_country ON public.products(city, country) WHERE is_active = true;

-- Mettre à jour les produits existants avec les informations du vendeur
UPDATE public.products p
SET 
  city = prof.city,
  country = prof.country
FROM public.profiles prof
WHERE p.seller_id = prof.user_id
  AND p.city IS NULL;

-- Créer ou remplacer le trigger pour auto-remplir ville et pays lors de la création de produit
CREATE OR REPLACE FUNCTION public.auto_fill_product_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_profile RECORD;
BEGIN
  -- Récupérer les informations de localisation du vendeur
  SELECT city, country INTO seller_profile
  FROM public.profiles
  WHERE user_id = NEW.seller_id;
  
  -- Auto-remplir la ville et le pays si non fournis
  IF NEW.city IS NULL THEN
    NEW.city := seller_profile.city;
  END IF;
  
  IF NEW.country IS NULL THEN
    NEW.country := COALESCE(seller_profile.country, 'CI');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur insert et update de produits
DROP TRIGGER IF EXISTS trigger_auto_fill_product_location ON public.products;
CREATE TRIGGER trigger_auto_fill_product_location
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_product_location();