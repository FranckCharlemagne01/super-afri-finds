
-- Add commune column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commune text NULL;

-- Add commune column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS commune text NULL;
