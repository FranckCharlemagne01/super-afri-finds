
-- 1. Nettoyer les produits avec images NULL
UPDATE products 
SET images = '{}'::text[], updated_at = now()
WHERE images IS NULL;

-- 2. Créer une fonction de validation pour les images
CREATE OR REPLACE FUNCTION public.ensure_product_images_array()
RETURNS TRIGGER AS $$
BEGIN
  -- Si images est NULL, forcer à tableau vide
  IF NEW.images IS NULL THEN
    NEW.images := '{}'::text[];
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. Créer le trigger sur INSERT et UPDATE
DROP TRIGGER IF EXISTS trigger_ensure_product_images ON products;
CREATE TRIGGER trigger_ensure_product_images
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_product_images_array();

-- 4. Ajouter une contrainte NOT NULL avec défaut sur la colonne images
ALTER TABLE products 
  ALTER COLUMN images SET DEFAULT '{}'::text[],
  ALTER COLUMN images SET NOT NULL;
