
-- Drop et recréer check_token_balance avec type json
DROP FUNCTION IF EXISTS public.check_token_balance(uuid);

CREATE OR REPLACE FUNCTION public.check_token_balance(_seller_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _balance INTEGER;
  _bonus INTEGER;
  _free INTEGER;
  _paid INTEGER;
  _expires_at TIMESTAMPTZ;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF current_user_id != _seller_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM expire_free_tokens();

  SELECT token_balance, COALESCE(bonus_tokens_count, 0), COALESCE(free_tokens_count, 0), COALESCE(paid_tokens_count, 0), free_tokens_expires_at
  INTO _balance, _bonus, _free, _paid, _expires_at
  FROM seller_tokens WHERE seller_id = _seller_id;

  IF _balance IS NULL THEN
    INSERT INTO seller_tokens (seller_id, token_balance, bonus_tokens_count, free_tokens_count, paid_tokens_count)
    VALUES (_seller_id, 0, 0, 0, 0)
    ON CONFLICT (seller_id) DO NOTHING;
    RETURN json_build_object('has_tokens', false, 'token_balance', 0, 'bonus_tokens', 0, 'free_tokens', 0, 'paid_tokens', 0, 'expires_at', null);
  END IF;

  IF _expires_at IS NOT NULL AND _expires_at <= now() THEN
    _free := 0;
  END IF;

  RETURN json_build_object(
    'has_tokens', (_bonus + _free + _paid) > 0,
    'token_balance', _bonus + _free + _paid,
    'bonus_tokens', _bonus,
    'free_tokens', _free,
    'paid_tokens', _paid,
    'expires_at', _expires_at
  );
END;
$$;

-- Recalculer bonus_tokens_count depuis admin transactions
UPDATE seller_tokens st SET
  bonus_tokens_count = GREATEST(0, COALESCE((
    SELECT SUM(tokens_amount) FROM token_transactions tt
    WHERE tt.seller_id = st.seller_id
      AND tt.transaction_type IN ('admin_credit', 'admin_debit')
      AND tt.status = 'completed'
  ), 0));

-- Recalculer token_balance
UPDATE seller_tokens SET
  token_balance = COALESCE(bonus_tokens_count, 0)
    + CASE WHEN free_tokens_expires_at IS NULL OR free_tokens_expires_at > now()
           THEN COALESCE(free_tokens_count, 0) ELSE 0 END
    + COALESCE(paid_tokens_count, 0),
  updated_at = now();

-- Recréer consume_token_for_publish (ordre: bonus > free > paid)
CREATE OR REPLACE FUNCTION public.consume_token_for_publish(p_seller uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bonus int;
  _free int;
  _paid int;
  _free_exp timestamptz;
BEGIN
  SELECT COALESCE(bonus_tokens_count, 0), COALESCE(free_tokens_count, 0), COALESCE(paid_tokens_count, 0), free_tokens_expires_at
  INTO _bonus, _free, _paid, _free_exp
  FROM seller_tokens WHERE seller_id = p_seller FOR UPDATE;

  IF _bonus > 0 THEN
    UPDATE seller_tokens SET bonus_tokens_count = bonus_tokens_count - 1, token_balance = token_balance - 1, updated_at = now() WHERE seller_id = p_seller;
    INSERT INTO token_transactions(seller_id, transaction_type, tokens_amount, status) VALUES (p_seller, 'publish', -1, 'completed');
    RETURN;
  END IF;

  IF _free > 0 AND (_free_exp IS NULL OR _free_exp > now()) THEN
    UPDATE seller_tokens SET free_tokens_count = free_tokens_count - 1, token_balance = token_balance - 1, updated_at = now() WHERE seller_id = p_seller;
    INSERT INTO token_transactions(seller_id, transaction_type, tokens_amount, status) VALUES (p_seller, 'publish', -1, 'completed');
    RETURN;
  END IF;

  IF _paid > 0 THEN
    UPDATE seller_tokens SET paid_tokens_count = paid_tokens_count - 1, token_balance = token_balance - 1, updated_at = now() WHERE seller_id = p_seller;
    INSERT INTO token_transactions(seller_id, transaction_type, tokens_amount, status) VALUES (p_seller, 'publish', -1, 'completed');
    RETURN;
  END IF;

  RAISE EXCEPTION 'Jetons insuffisants : paiement requis';
END;
$$;

-- Mettre à jour consume_token_for_publication (même logique)
CREATE OR REPLACE FUNCTION public.consume_token_for_publication(_seller_id uuid, _product_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bonus int;
  _free int;
  _paid int;
  _free_exp timestamptz;
BEGIN
  SELECT COALESCE(bonus_tokens_count, 0), COALESCE(free_tokens_count, 0), COALESCE(paid_tokens_count, 0), free_tokens_expires_at
  INTO _bonus, _free, _paid, _free_exp
  FROM seller_tokens WHERE seller_id = _seller_id FOR UPDATE;

  IF _bonus > 0 THEN
    UPDATE seller_tokens SET bonus_tokens_count = bonus_tokens_count - 1, token_balance = token_balance - 1, updated_at = now() WHERE seller_id = _seller_id;
    INSERT INTO token_transactions(seller_id, transaction_type, tokens_amount, status, product_id) VALUES (_seller_id, 'publish', -1, 'completed', _product_id);
    RETURN true;
  END IF;

  IF _free > 0 AND (_free_exp IS NULL OR _free_exp > now()) THEN
    UPDATE seller_tokens SET free_tokens_count = free_tokens_count - 1, token_balance = token_balance - 1, updated_at = now() WHERE seller_id = _seller_id;
    INSERT INTO token_transactions(seller_id, transaction_type, tokens_amount, status, product_id) VALUES (_seller_id, 'publish', -1, 'completed', _product_id);
    RETURN true;
  END IF;

  IF _paid > 0 THEN
    UPDATE seller_tokens SET paid_tokens_count = paid_tokens_count - 1, token_balance = token_balance - 1, updated_at = now() WHERE seller_id = _seller_id;
    INSERT INTO token_transactions(seller_id, transaction_type, tokens_amount, status, product_id) VALUES (_seller_id, 'publish', -1, 'completed', _product_id);
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
