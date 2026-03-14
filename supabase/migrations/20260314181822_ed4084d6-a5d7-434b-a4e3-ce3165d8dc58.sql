
-- Create KYC verifications table
CREATE TABLE public.kyc_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selfie_url TEXT NOT NULL,
  id_front_url TEXT NOT NULL,
  id_back_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own KYC
CREATE POLICY "Users can view their own KYC"
  ON public.kyc_verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own KYC
CREATE POLICY "Users can submit their KYC"
  ON public.kyc_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending KYC (resubmit)
CREATE POLICY "Users can update their pending KYC"
  ON public.kyc_verifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status IN ('pending', 'rejected'));

-- Superadmins can manage all KYC
CREATE POLICY "Superadmins can manage all KYC"
  ON public.kyc_verifications
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'::user_role));

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false);

-- Storage RLS: users can upload their own KYC documents
CREATE POLICY "Users can upload KYC documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view their own KYC documents
CREATE POLICY "Users can view own KYC documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Superadmins can view all KYC documents
CREATE POLICY "Superadmins can view all KYC documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'superadmin'::user_role));

-- Function to get KYC status for a user
CREATE OR REPLACE FUNCTION public.get_kyc_status(_user_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT json_build_object(
      'status', status,
      'admin_note', admin_note,
      'created_at', created_at,
      'reviewed_at', reviewed_at
    )
    FROM public.kyc_verifications
    WHERE user_id = _user_id),
    json_build_object('status', 'none')
  );
$$;

-- Function for superadmin to approve/reject KYC
CREATE OR REPLACE FUNCTION public.review_kyc(
  _kyc_id UUID,
  _status TEXT,
  _admin_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _status NOT IN ('approved', 'rejected') THEN
    RETURN json_build_object('success', false, 'error', 'Statut invalide');
  END IF;

  IF NOT has_role(auth.uid(), 'superadmin'::user_role) THEN
    RETURN json_build_object('success', false, 'error', 'Non autorisé');
  END IF;

  UPDATE public.kyc_verifications
  SET status = _status,
      admin_note = _admin_note,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _kyc_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'KYC non trouvé');
  END IF;

  RETURN json_build_object('success', true, 'message', 
    CASE WHEN _status = 'approved' THEN 'Vérification approuvée'
    ELSE 'Vérification rejetée' END);
END;
$$;
