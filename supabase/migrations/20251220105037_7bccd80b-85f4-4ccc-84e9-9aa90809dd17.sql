-- 1) Strict DB barrier: products.images must contain ONLY public URLs from product-images bucket
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
  -- Always an array
  NEW.images := COALESCE(NEW.images, ARRAY[]::text[]);

  -- Normalize + remove empties + strip query string + de-dup
  cleaned := COALESCE(
    (
      SELECT array_agg(DISTINCT url_clean)
      FROM (
        SELECT split_part(btrim(img), '?', 1) AS url_clean
        FROM unnest(NEW.images) AS img
      ) s
      WHERE url_clean IS NOT NULL
        AND url_clean <> ''
        AND lower(url_clean) NOT IN ('null','undefined')
    ),
    ARRAY[]::text[]
  );

  -- Block anything outside our public bucket URL format
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

DROP TRIGGER IF EXISTS validate_product_images_trigger ON public.products;
CREATE TRIGGER validate_product_images_trigger
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.validate_product_images();

-- 2) One-time HARD cleanup in DB (format-only). Edge function handles HTTP/Storage reality.
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
  ARRAY[]::text[]
),
updated_at = now();

-- 3) Ensure schema guarantees
ALTER TABLE public.products
  ALTER COLUMN images SET DEFAULT ARRAY[]::text[],
  ALTER COLUMN images SET NOT NULL;

-- 4) Storage barrier: only authenticated users can upload into their own folder in product-images bucket
-- NOTE: Policies live on storage.objects (Supabase-managed schema). This is allowed.
DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
CREATE POLICY "Public read product-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Users upload own product-images" ON storage.objects;
CREATE POLICY "Users upload own product-images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users update own product-images" ON storage.objects;
CREATE POLICY "Users update own product-images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users delete own product-images" ON storage.objects;
CREATE POLICY "Users delete own product-images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
