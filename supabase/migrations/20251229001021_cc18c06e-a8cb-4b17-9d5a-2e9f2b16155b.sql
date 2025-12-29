-- =====================================================
-- Système fiable d'attribution de jetons pour nouveaux vendeurs
-- =====================================================

-- Fonction pour attribuer automatiquement les jetons d'essai gratuit
-- Appelée à chaque accès au dashboard vendeur
CREATE OR REPLACE FUNCTION public.ensure_seller_trial_tokens(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_seller boolean;
  profile_created_at timestamp with time zone;
  has_trial_bonus boolean;
  existing_trial_transaction boolean;
  result jsonb;
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_user_id');
  END IF;

  -- Vérifier si l'utilisateur est vendeur
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'seller'
  ) INTO is_seller;

  IF NOT is_seller THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_seller');
  END IF;

  -- Récupérer les infos du profil
  SELECT created_at, COALESCE(trial_bonus_tokens_given, false)
  INTO profile_created_at, has_trial_bonus
  FROM public.profiles
  WHERE user_id = _user_id;

  -- Vérifier si une transaction free_trial existe déjà
  SELECT EXISTS (
    SELECT 1 FROM public.token_transactions
    WHERE seller_id = _user_id 
    AND transaction_type = 'free_trial'
    AND status = 'completed'
  ) INTO existing_trial_transaction;

  -- Si déjà reçu les jetons, ne rien faire
  IF existing_trial_transaction OR has_trial_bonus THEN
    RETURN jsonb_build_object(
      'success', true, 
      'reason', 'already_received',
      'already_had_tokens', true
    );
  END IF;

  -- Vérifier si créé il y a moins de 24h OU n'a jamais reçu de bonus
  -- (on donne aussi aux vendeurs récents qui auraient raté l'attribution)
  IF profile_created_at IS NULL OR 
     profile_created_at > (now() - INTERVAL '24 hours') OR 
     NOT has_trial_bonus THEN
    
    -- Initialiser ou mettre à jour seller_tokens
    INSERT INTO public.seller_tokens (
      seller_id, 
      token_balance, 
      free_tokens_count, 
      paid_tokens_count,
      free_tokens_expires_at
    )
    VALUES (
      _user_id, 
      100, 
      100, 
      0, 
      now() + INTERVAL '28 days'
    )
    ON CONFLICT (seller_id) DO UPDATE SET
      free_tokens_count = GREATEST(100, seller_tokens.free_tokens_count),
      token_balance = GREATEST(100, seller_tokens.token_balance),
      free_tokens_expires_at = CASE 
        WHEN seller_tokens.free_tokens_expires_at IS NULL 
          OR seller_tokens.free_tokens_expires_at < now()
        THEN now() + INTERVAL '28 days'
        ELSE seller_tokens.free_tokens_expires_at
      END,
      updated_at = now();

    -- Enregistrer la transaction free_trial (avec contrainte d'unicité)
    INSERT INTO public.token_transactions (
      seller_id,
      transaction_type,
      tokens_amount,
      status
    ) VALUES (
      _user_id,
      'free_trial',
      100,
      'completed'
    )
    ON CONFLICT DO NOTHING;

    -- Mettre à jour le profil
    UPDATE public.profiles
    SET 
      trial_bonus_tokens_given = true,
      trial_start_date = COALESCE(trial_start_date, now()),
      trial_end_date = CASE 
        WHEN trial_end_date IS NULL OR trial_end_date < now()
        THEN now() + INTERVAL '28 days'
        ELSE trial_end_date
      END,
      trial_used = false,
      updated_at = now()
    WHERE user_id = _user_id;

    -- Log pour debug
    RAISE LOG 'Trial tokens allocated: user_id=%, tokens=100, expires=%', 
      _user_id, now() + INTERVAL '28 days';

    RETURN jsonb_build_object(
      'success', true,
      'reason', 'tokens_allocated',
      'tokens_amount', 100,
      'expires_at', now() + INTERVAL '28 days',
      'already_had_tokens', false
    );
  END IF;

  RETURN jsonb_build_object('success', false, 'reason', 'conditions_not_met');
END;
$$;

-- Ajouter un index unique sur token_transactions pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS idx_token_transactions_unique_trial
ON public.token_transactions (seller_id, transaction_type)
WHERE transaction_type = 'free_trial';

-- Rattrapage: attribuer les jetons aux vendeurs récents (< 24h) qui n'ont pas reçu
DO $$
DECLARE
  seller_record RECORD;
BEGIN
  FOR seller_record IN 
    SELECT ur.user_id, p.created_at
    FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    LEFT JOIN public.token_transactions tt 
      ON tt.seller_id = ur.user_id AND tt.transaction_type = 'free_trial'
    WHERE ur.role = 'seller'
      AND p.created_at > (now() - INTERVAL '24 hours')
      AND tt.id IS NULL
      AND COALESCE(p.trial_bonus_tokens_given, false) = false
  LOOP
    PERFORM public.ensure_seller_trial_tokens(seller_record.user_id);
    RAISE LOG 'Retroactive trial tokens for recent seller: %', seller_record.user_id;
  END LOOP;
END;
$$;