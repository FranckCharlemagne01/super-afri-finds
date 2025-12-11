-- Table pour stocker les OTP temporaires
CREATE TABLE IF NOT EXISTS public.phone_otp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
  verified BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide par téléphone
CREATE INDEX IF NOT EXISTS idx_phone_otp_phone ON public.phone_otp(phone);
CREATE INDEX IF NOT EXISTS idx_phone_otp_expires ON public.phone_otp(expires_at);

-- RLS
ALTER TABLE public.phone_otp ENABLE ROW LEVEL SECURITY;

-- Politique: Personne ne peut lire les OTP directement (seulement via edge function)
CREATE POLICY "No direct OTP access" ON public.phone_otp
  FOR ALL USING (false);

-- Fonction pour nettoyer les OTP expirés (à appeler périodiquement)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.phone_otp WHERE expires_at < now();
END;
$$;