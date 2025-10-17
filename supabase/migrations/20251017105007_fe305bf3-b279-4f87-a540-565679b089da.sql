-- Ajouter le champ email_verified à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token text,
ADD COLUMN IF NOT EXISTS email_verification_expires_at timestamp with time zone;

-- Index pour améliorer les performances de recherche par token
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token 
ON public.profiles(email_verification_token) 
WHERE email_verification_token IS NOT NULL;

-- Fonction pour vérifier l'email avec le token
CREATE OR REPLACE FUNCTION public.verify_email_with_token(_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Vérifier si le token existe et n'est pas expiré
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE email_verification_token = _token
    AND email_verification_expires_at > now()
    AND email_verified = false;
  
  IF profile_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Token invalide ou expiré'
    );
  END IF;
  
  -- Marquer l'email comme vérifié
  UPDATE public.profiles
  SET 
    email_verified = true,
    email_verification_token = NULL,
    email_verification_expires_at = NULL,
    updated_at = now()
  WHERE user_id = profile_record.user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Email vérifié avec succès',
    'user_id', profile_record.user_id
  );
END;
$$;