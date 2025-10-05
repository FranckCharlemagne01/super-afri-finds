-- Ajouter un champ pour tracker si les jetons bonus ont été attribués
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_bonus_tokens_given BOOLEAN DEFAULT false;

-- Fonction pour attribuer les jetons bonus après l'essai gratuit
CREATE OR REPLACE FUNCTION public.grant_trial_bonus_tokens(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_record RECORD;
  current_balance INTEGER;
BEGIN
  -- Récupérer les informations du profil
  SELECT 
    trial_end_date,
    trial_bonus_tokens_given,
    trial_used
  INTO profile_record
  FROM profiles
  WHERE user_id = _user_id;
  
  -- Vérifier si le profil existe
  IF profile_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Profil introuvable'
    );
  END IF;
  
  -- Vérifier si les jetons ont déjà été donnés
  IF profile_record.trial_bonus_tokens_given = true THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Jetons bonus déjà attribués'
    );
  END IF;
  
  -- Vérifier si l'essai est terminé
  IF profile_record.trial_end_date > now() THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Période d''essai toujours active'
    );
  END IF;
  
  -- Initialiser les jetons si nécessaire
  INSERT INTO public.seller_tokens (seller_id, token_balance)
  VALUES (_user_id, 0)
  ON CONFLICT (seller_id) DO NOTHING;
  
  -- Ajouter 20 jetons
  UPDATE public.seller_tokens
  SET token_balance = token_balance + 20,
      updated_at = now()
  WHERE seller_id = _user_id;
  
  -- Enregistrer la transaction
  INSERT INTO public.token_transactions (
    seller_id,
    transaction_type,
    tokens_amount,
    status
  ) VALUES (
    _user_id,
    'trial_bonus',
    20,
    'completed'
  );
  
  -- Marquer les jetons comme donnés
  UPDATE public.profiles
  SET trial_bonus_tokens_given = true,
      updated_at = now()
  WHERE user_id = _user_id;
  
  -- Récupérer le nouveau solde
  SELECT token_balance INTO current_balance
  FROM public.seller_tokens
  WHERE seller_id = _user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', '20 jetons bonus attribués avec succès',
    'new_balance', current_balance
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;