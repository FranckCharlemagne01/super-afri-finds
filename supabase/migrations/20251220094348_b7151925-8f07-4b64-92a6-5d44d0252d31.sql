-- Clean up existing products with NULL, empty or invalid images
UPDATE public.products
SET images = ARRAY[]::text[]
WHERE images IS NULL OR array_length(images, 1) IS NULL;

-- Create a function to validate and clean product images
CREATE OR REPLACE FUNCTION public.validate_product_images()
RETURNS TRIGGER AS $$
BEGIN
  -- If images is NULL, set to empty array
  IF NEW.images IS NULL THEN
    NEW.images := ARRAY[]::text[];
  END IF;
  
  -- Filter out NULL, empty strings, and invalid URLs from the array
  NEW.images := ARRAY(
    SELECT DISTINCT img
    FROM unnest(NEW.images) AS img
    WHERE img IS NOT NULL 
      AND img <> '' 
      AND img <> 'null'
      AND img <> 'undefined'
      AND (
        img LIKE 'http://%' 
        OR img LIKE 'https://%' 
        OR img LIKE '/%'
        OR img LIKE 'data:image/%'
      )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS validate_product_images_trigger ON public.products;

-- Create trigger to validate images on INSERT and UPDATE
CREATE TRIGGER validate_product_images_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_product_images();

-- Add NOT NULL constraint with default value for images column
ALTER TABLE public.products 
  ALTER COLUMN images SET DEFAULT ARRAY[]::text[],
  ALTER COLUMN images SET NOT NULL;