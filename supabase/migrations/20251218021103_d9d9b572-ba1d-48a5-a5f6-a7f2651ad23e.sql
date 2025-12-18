-- Nettoyage + prévention durable sur products.images

-- 1) Nettoyer les tableaux d'images existants (supprime entrées vides/invalides)
UPDATE public.products p
SET
  images = COALESCE(
    (
      SELECT array_agg(DISTINCT cleaned) 
      FROM (
        SELECT btrim(img) AS cleaned
        FROM unnest(p.images) AS img
        WHERE img IS NOT NULL
          AND btrim(img) <> ''
          AND lower(btrim(img)) NOT IN ('undefined', 'null')
          AND img ~ '^(https?://|/|data:image/|blob:)'
      ) s
    ),
    '{}'::text[]
  ),
  updated_at = now()
WHERE EXISTS (
  SELECT 1
  FROM unnest(p.images) AS img
  WHERE img IS NULL
     OR btrim(img) = ''
     OR lower(btrim(img)) IN ('undefined','null')
     OR img !~ '^(https?://|/|data:image/|blob:)'
);

-- 2) Étendre la fonction trigger pour forcer [] et nettoyer à chaque INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.ensure_product_images_array()
RETURNS TRIGGER AS $$
BEGIN
  -- Force tableau vide si NULL
  NEW.images := COALESCE(NEW.images, '{}'::text[]);

  -- Nettoyage: trim + suppression entrées invalides + déduplication
  NEW.images := COALESCE(
    (
      SELECT array_agg(DISTINCT cleaned)
      FROM (
        SELECT btrim(img) AS cleaned
        FROM unnest(NEW.images) AS img
        WHERE img IS NOT NULL
          AND btrim(img) <> ''
          AND lower(btrim(img)) NOT IN ('undefined','null')
          AND img ~ '^(https?://|/|data:image/|blob:)'
      ) s
    ),
    '{}'::text[]
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger déjà en place (trigger_ensure_product_images), on le garde tel quel.

-- 3) Garanties colonne (au cas où un env diff aurait divergé)
ALTER TABLE public.products
  ALTER COLUMN images SET DEFAULT '{}'::text[],
  ALTER COLUMN images SET NOT NULL;
