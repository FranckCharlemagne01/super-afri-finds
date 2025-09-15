-- Add media support to messages table
ALTER TABLE public.messages 
ADD COLUMN media_url TEXT,
ADD COLUMN media_type TEXT CHECK (media_type IN ('image', 'video')),
ADD COLUMN media_name TEXT;

-- Create storage bucket for chat media if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for chat media
CREATE POLICY "Users can view chat media they are involved in" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'chat-media' AND 
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.messages 
      WHERE media_url LIKE '%' || name AND 
      (sender_id = auth.uid() OR recipient_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can upload chat media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'chat-media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own chat media" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'chat-media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);