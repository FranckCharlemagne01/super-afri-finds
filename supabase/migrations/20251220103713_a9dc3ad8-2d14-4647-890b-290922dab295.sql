-- 1) Remplacer la validation images par une version STRICTE (aucune URL invalide ne peut être enregistrée)
--    Règle: on n'autorise QUE les URLs publiques du bucket 'product-images' de ce projet.
--    On normalise: trim + suppression querystring + suppression vides + dédup.
--    Si une URL invalide est fournie, on BLOQUE l'INSERT/UPDATE.

CREATE OR REPLACE FUNCTION public.validate_product_images()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned text[];
  invalid_count int;
BEGIN
  -- Toujours un tableau (jamais NULL)
  NEW.images := COALESCE(NEW.images, '{}'::text[]);

  -- Normalisation + filtre format
  cleaned := COALESCE(
    (
      SELECT array_agg(DISTINCT url_clean)
      FROM (
        SELECT
          -- trim + enlever querystring (?...) pour stabiliser les comparaisons
          split_part(btrim(img), '?', 1) AS url_clean
        FROM unnest(NEW.images) AS img
      ) s
      WHERE url_clean IS NOT NULL
        AND url_clean <> ''
        AND lower(url_clean) NOT IN ('null','undefined')
    ),
    '{}'::text[]
  );

  -- Compter les URLs qui ne respectent PAS le format autorisé
  SELECT COUNT(*) INTO invalid_count
  FROM unnest(cleaned) AS u(url)
  WHERE NOT (
    url ~ '^https://zqskpspbyzptzjcoitwt\\.supabase\\.co/storage/v1/object/public/product-images/.+'
  );

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Invalid product image URL(s): only Supabase public product-images URLs are allowed'
      USING ERRCODE = '22000';
  END IF;

  NEW.images := cleaned;
  RETURN NEW;
END;
$$;

-- 2) Recréer le trigger si nécessaire
DROP TRIGGER IF EXISTS validate_product_images_trigger ON public.products;
CREATE TRIGGER validate_product_images_trigger
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.validate_product_images();

-- 3) Nettoyage immédiat (sans bloquer): retirer de la DB tout ce qui n'est pas au format autorisé
--    On laisse images = [] si rien ne reste.
UPDATE public.products p
SET images = COALESCE(
  (
    SELECT array_agg(DISTINCT split_part(btrim(img), '?', 1))
    FROM unnest(p.images) AS img
    WHERE img IS NOT NULL
      AND btrim(img) <> ''
      AND lower(btrim(img)) NOT IN ('null','undefined')
      AND split_part(btrim(img), '?', 1) ~ '^https://zqskpspbyzptzjcoitwt\\.supabase\\.co/storage/v1/object/public/product-images/.+'
  ),
  '{}'::text[]
),
updated_at = now();

-- 4) Sécurité: garantir le type attendu
ALTER TABLE public.products
  ALTER COLUMN images SET DEFAULT ARRAY[]::text[],
  ALTER COLUMN images SET NOT NULL;
