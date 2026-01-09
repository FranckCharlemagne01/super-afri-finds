-- Améliorer la fonction d'attribution des jetons pour les nouveaux vendeurs
-- Règle: Si solde = 0, attribuer 100 jetons gratuits valables 28 jours

CREATE OR REPLACE FUNCTION public.ensure_seller_trial_tokens(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_balance integer;
  _has_tokens_record boolean;
  _is_seller boolean;
  _result jsonb;
BEGIN
  -- Vérifier si l'utilisateur est vendeur
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = _user_id AND role = 'seller'
  ) INTO _is_seller;
  
  -- Si pas vendeur, ne rien faire
  IF NOT _is_seller THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'not_a_seller'
    );
  END IF;
  
  -- Vérifier si un record de jetons existe déjà
  SELECT EXISTS (
    SELECT 1 FROM seller_tokens WHERE seller_id = _user_id
  ) INTO _has_tokens_record;
  
  -- Obtenir le solde actuel (0 si pas de record)
  SELECT COALESCE(token_balance, 0) INTO _current_balance
  FROM seller_tokens WHERE seller_id = _user_id;
  
  -- Si pas de record, en créer un avec 100 jetons gratuits
  IF NOT _has_tokens_record THEN
    INSERT INTO seller_tokens (
      seller_id,
      token_balance,
      free_tokens_count,
      paid_tokens_count,
      free_tokens_expires_at,
      created_at,
      updated_at
    ) VALUES (
      _user_id,
      100,
      100,
      0,
      NOW() + INTERVAL '28 days',
      NOW(),
      NOW()
    );
    
    -- Enregistrer la transaction
    INSERT INTO token_transactions (
      seller_id,
      tokens_amount,
      transaction_type,
      status,
      created_at
    ) VALUES (
      _user_id,
      100,
      'trial_bonus',
      'completed',
      NOW()
    );
    
    -- Marquer le bonus comme donné dans profiles
    UPDATE profiles 
    SET trial_bonus_tokens_given = true 
    WHERE user_id = _user_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'reason', 'tokens_allocated',
      'tokens_amount', 100
    );
  END IF;
  
  -- Si record existe mais solde = 0 ET pas encore reçu le bonus
  IF _current_balance = 0 THEN
    -- Vérifier si le bonus a déjà été donné
    IF EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = _user_id 
      AND trial_bonus_tokens_given = true
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'bonus_already_given'
      );
    END IF;
    
    -- Vérifier si une transaction trial_bonus existe déjà
    IF EXISTS (
      SELECT 1 FROM token_transactions 
      WHERE seller_id = _user_id 
      AND transaction_type = 'trial_bonus'
      AND status = 'completed'
    ) THEN
      -- Marquer comme donné et retourner
      UPDATE profiles 
      SET trial_bonus_tokens_given = true 
      WHERE user_id = _user_id;
      
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'bonus_already_given'
      );
    END IF;
    
    -- Attribuer les 100 jetons gratuits
    UPDATE seller_tokens SET
      token_balance = 100,
      free_tokens_count = 100,
      free_tokens_expires_at = NOW() + INTERVAL '28 days',
      updated_at = NOW()
    WHERE seller_id = _user_id;
    
    -- Enregistrer la transaction
    INSERT INTO token_transactions (
      seller_id,
      tokens_amount,
      transaction_type,
      status,
      created_at
    ) VALUES (
      _user_id,
      100,
      'trial_bonus',
      'completed',
      NOW()
    );
    
    -- Marquer le bonus comme donné
    UPDATE profiles 
    SET trial_bonus_tokens_given = true 
    WHERE user_id = _user_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'reason', 'tokens_allocated',
      'tokens_amount', 100
    );
  END IF;
  
  -- Solde > 0, pas besoin d'attribuer
  RETURN jsonb_build_object(
    'success', false,
    'reason', 'already_has_tokens',
    'current_balance', _current_balance
  );
END;
$$;