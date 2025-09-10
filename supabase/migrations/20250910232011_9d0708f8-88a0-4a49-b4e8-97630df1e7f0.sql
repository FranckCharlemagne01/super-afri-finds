-- Create storage bucket for product videos
INSERT INTO storage.buckets (id, name, public) VALUES ('product-videos', 'product-videos', true);

-- Create RLS policies for product videos
CREATE POLICY "Product videos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-videos');

CREATE POLICY "Authenticated users can upload product videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own product videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own product videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add video_url column to products table
ALTER TABLE public.products 
ADD COLUMN video_url text;

-- Add comment to describe the new column
COMMENT ON COLUMN public.products.video_url IS 'URL of the product demonstration video (optional)';