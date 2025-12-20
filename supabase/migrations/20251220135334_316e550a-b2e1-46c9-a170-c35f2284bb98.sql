-- Simplify the trigger: ALLOW empty arrays, only validate non-empty URLs
CREATE OR REPLACE FUNCTION public.validate_product_images()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cleaned text[];
  invalid_count int;
BEGIN
  -- Always coerce to array
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
        AND lower(url_clean) NOT IN ('null', 'undefined')
    ),
    ARRAY[]::text[]
  );

  -- If no URLs after cleaning, allow empty array (products without images)
  IF array_length(cleaned, 1) IS NULL OR array_length(cleaned, 1) = 0 THEN
    NEW.images := ARRAY[]::text[];
    RETURN NEW;
  END IF;

  -- Block anything outside our public bucket URL format
  SELECT COUNT(*) INTO invalid_count
  FROM unnest(cleaned) AS u(url)
  WHERE NOT (
    url ~ '^https://zqskpspbyzptzjcoitwt\.supabase\.co/storage/v1/object/public/product-images/.+'
  );

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Invalid product image URL(s): only Supabase public product-images URLs are allowed'
      USING ERRCODE = '22000';
  END IF;

  NEW.images := cleaned;
  RETURN NEW;
END;
$$;