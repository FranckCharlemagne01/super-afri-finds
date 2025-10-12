-- SECURITY FIX: Make chat-media bucket private and add RLS policies
-- This fixes critical privacy violation where private customer-seller communications were exposed

-- Step 1: Make chat-media bucket private (if not already)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'chat-media';

-- Step 2: Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own chat media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own chat media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat media" ON storage.objects;
DROP POLICY IF EXISTS "Only sellers can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Only sellers can upload product videos" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can delete their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can delete their own product videos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to product videos" ON storage.objects;

-- Step 3: Add RLS policies for chat media access control
CREATE POLICY "Users can view their own chat media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-media' AND
  auth.uid() IS NOT NULL AND
  (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    auth.uid() IN (
      SELECT sender_id FROM messages WHERE media_url LIKE '%' || name
      UNION
      SELECT recipient_id FROM messages WHERE media_url LIKE '%' || name
    )
  )
);

CREATE POLICY "Users can upload their own chat media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-media' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Step 4: Add upload restrictions for product media (sellers only)
CREATE POLICY "Only sellers can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('seller', 'admin', 'superadmin')
  )
);

CREATE POLICY "Only sellers can upload product videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-videos' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('seller', 'admin', 'superadmin')
  )
);

CREATE POLICY "Sellers can delete their own product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('seller', 'admin', 'superadmin')
  )
);

CREATE POLICY "Sellers can delete their own product videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-videos' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('seller', 'admin', 'superadmin')
  )
);

-- Step 5: Allow public read access to product media (standard for e-commerce)
CREATE POLICY "Public read access to product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Public read access to product videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-videos');