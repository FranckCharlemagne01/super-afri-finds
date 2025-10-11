-- Security Fix: Clean up invalid data FIRST, then add constraints

-- Step 1: Clean up existing invalid discount_percentage data
UPDATE products
SET discount_percentage = NULL
WHERE discount_percentage < 0 OR discount_percentage > 100;

-- Step 2: Fix products where original_price < price
UPDATE products
SET original_price = NULL
WHERE original_price IS NOT NULL AND original_price < price;

-- Step 3: Now add constraint for discount percentage (must be 0-100 or NULL)
ALTER TABLE products
DROP CONSTRAINT IF EXISTS valid_discount_percentage;

ALTER TABLE products
ADD CONSTRAINT valid_discount_percentage 
CHECK (
  discount_percentage IS NULL OR 
  (discount_percentage >= 0 AND discount_percentage <= 100)
);

-- Step 4: Add constraint for pricing logic (original_price must be >= price if set)
ALTER TABLE products
DROP CONSTRAINT IF EXISTS valid_pricing;

ALTER TABLE products
ADD CONSTRAINT valid_pricing
CHECK (
  price > 0 AND
  (original_price IS NULL OR original_price >= price)
);

-- Security Fix: Block dangerous file types in storage buckets
-- Prevents SVG XSS, HTML injection, and executable uploads

-- Block dangerous file extensions in product-images bucket
DROP POLICY IF EXISTS "Block dangerous file types in product-images" ON storage.objects;
CREATE POLICY "Block dangerous file types in product-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  LOWER(name) NOT LIKE '%.svg' AND
  LOWER(name) NOT LIKE '%.html' AND
  LOWER(name) NOT LIKE '%.js' AND
  LOWER(name) NOT LIKE '%.htm' AND
  LOWER(name) NOT LIKE '%.php' AND
  LOWER(name) NOT LIKE '%.exe' AND
  LOWER(name) NOT LIKE '%.sh' AND
  LOWER(name) NOT LIKE '%.bat'
);

-- Block dangerous file extensions in product-videos bucket
DROP POLICY IF EXISTS "Block dangerous file types in product-videos" ON storage.objects;
CREATE POLICY "Block dangerous file types in product-videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-videos' AND
  LOWER(name) NOT LIKE '%.svg' AND
  LOWER(name) NOT LIKE '%.html' AND
  LOWER(name) NOT LIKE '%.js' AND
  LOWER(name) NOT LIKE '%.htm' AND
  LOWER(name) NOT LIKE '%.php' AND
  LOWER(name) NOT LIKE '%.exe' AND
  LOWER(name) NOT LIKE '%.sh' AND
  LOWER(name) NOT LIKE '%.bat'
);