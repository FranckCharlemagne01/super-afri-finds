
-- Drop existing function with old return type
DROP FUNCTION IF EXISTS public.admin_adjust_tokens(uuid, integer, text);

-- 1. Add bonus_tokens_count column
ALTER TABLE public.seller_tokens
ADD COLUMN IF NOT EXISTS bonus_tokens_count integer DEFAULT 0;

-- 2. Recreate admin_adjust_tokens to credit/debit bonus tokens
CREATE OR REPLACE FUNCTION public.admin_adjust_tokens(_seller_id uuid, _amount integer, _reason text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_balance integer;
  _current_bonus integer;
  _new_balance integer;
  _new_bonus integer;
  _tx_type text;
BEGIN
  IF NOT has_role(auth.uid(), 'superadmin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  INSERT INTO seller_tokens (seller_id, token_balance, bonus_tokens_count)
  VALUES (_seller_id, 0, 0)
  ON CONFLICT (seller_id) DO NOTHING;

  SELECT token_balance, COALESCE(bonus_tokens_count, 0)
  INTO _current_balance, _current_bonus
  FROM seller_tokens WHERE seller_id = _seller_id FOR UPDATE;

  IF _amount > 0 THEN
    _new_bonus := _current_bonus + _amount;
    _new_balance := _current_balance + _amount;
    _tx_type := 'admin_credit';
  ELSE
    IF _current_bonus + _amount < 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Solde bonus insuffisant');
    END IF;
    _new_bonus := _current_bonus + _amount;
    _new_balance := _current_balance + _amount;
    IF _new_balance < 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Le solde ne peut pas être négatif');
    END IF;
    _tx_type := 'admin_debit';
  END IF;

  UPDATE seller_tokens
  SET token_balance = _new_balance,
      bonus_tokens_count = _new_bonus,
      updated_at = now()
  WHERE seller_id = _seller_id;

  INSERT INTO token_transactions (seller_id, transaction_type, tokens_amount, status, paystack_reference)
  VALUES (_seller_id, _tx_type, _amount, 'completed', _reason);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', _new_balance,
    'bonus_tokens', _new_bonus
  );
END;
$$;

-- 3. Update consume_token_for_publication: bonus first, then paid
CREATE OR REPLACE FUNCTION public.consume_token_for_publication(_seller_id uuid, _product_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _balance integer;
  _bonus integer;
  _paid integer;
  _free integer;
  _free_exp timestamptz;
BEGIN
  SELECT token_balance, COALESCE(bonus_tokens_count, 0), COALESCE(paid_tokens_count, 0), COALESCE(free_tokens_count, 0), free_tokens_expires_at
  INTO _balance, _bonus, _paid, _free, _free_exp
  FROM seller_tokens WHERE seller_id = _seller_id FOR UPDATE;

  IF _balance IS NULL OR _balance < 1 THEN
    RETURN false;
  END IF;

  IF _bonus > 0 THEN
    UPDATE seller_tokens SET token_balance = token_balance - 1, bonus_tokens_count = bonus_tokens_count - 1, updated_at = now() WHERE seller_id = _seller_id;
  ELSIF _free > 0 AND (_free_exp IS NULL OR _free_exp > now()) THEN
    UPDATE seller_tokens SET token_balance = token_balance - 1, free_tokens_count = free_tokens_count - 1, updated_at = now() WHERE seller_id = _seller_id;
  ELSIF _paid > 0 THEN
    UPDATE seller_tokens SET token_balance = token_balance - 1, paid_tokens_count = paid_tokens_count - 1, updated_at = now() WHERE seller_id = _seller_id;
  ELSE
    RETURN false;
  END IF;

  INSERT INTO token_transactions (seller_id, transaction_type, tokens_amount, status, product_id)
  VALUES (_seller_id, 'usage', -1, 'completed', _product_id);

  RETURN true;
END;
$$;

-- 4. Update can_insert_products: allow if bonus > 0 or paid > 0 regardless of trial
CREATE OR REPLACE FUNCTION public.can_insert_products(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bonus integer;
  _paid integer;
  _free integer;
  _free_exp timestamptz;
  _balance integer;
  _has_sub boolean;
  _in_trial boolean;
BEGIN
  SELECT token_balance, COALESCE(bonus_tokens_count, 0), COALESCE(paid_tokens_count, 0), COALESCE(free_tokens_count, 0), free_tokens_expires_at
  INTO _balance, _bonus, _paid, _free, _free_exp
  FROM seller_tokens WHERE seller_id = _user_id;

  IF _bonus > 0 THEN RETURN true; END IF;
  IF _paid > 0 THEN RETURN true; END IF;
  IF _free > 0 AND (_free_exp IS NULL OR _free_exp > now()) THEN RETURN true; END IF;

  SELECT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = _user_id AND status = 'active' AND subscription_end > now()) INTO _has_sub;
  IF _has_sub THEN RETURN true; END IF;

  _in_trial := is_in_trial_period(_user_id);
  IF _in_trial AND COALESCE(_balance, 0) > 0 THEN RETURN true; END IF;

  RETURN false;
END;
$$;

-- 5. Update can_access_seller_features to include bonus tokens
CREATE OR REPLACE FUNCTION public.can_access_seller_features(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _in_trial boolean;
  _trial_days_left integer;
  _trial_end timestamptz;
  _has_sub boolean;
  _sub_end timestamptz;
  _sub_status text;
  _can_access boolean;
  _bonus integer;
  _paid integer;
BEGIN
  SELECT 
    CASE WHEN p.trial_end_date > now() AND NOT COALESCE(p.trial_used, false) THEN true ELSE false END,
    GREATEST(0, EXTRACT(DAY FROM (p.trial_end_date - now()))::integer),
    p.trial_end_date
  INTO _in_trial, _trial_days_left, _trial_end
  FROM profiles p WHERE p.user_id = _user_id;

  SELECT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = _user_id AND status = 'active' AND subscription_end > now()) INTO _has_sub;

  SELECT subscription_end, status INTO _sub_end, _sub_status
  FROM subscriptions WHERE user_id = _user_id ORDER BY created_at DESC LIMIT 1;

  SELECT COALESCE(bonus_tokens_count, 0), COALESCE(paid_tokens_count, 0)
  INTO _bonus, _paid
  FROM seller_tokens WHERE seller_id = _user_id;

  _can_access := COALESCE(_in_trial, false) OR COALESCE(_has_sub, false) OR COALESCE(_bonus, 0) > 0 OR COALESCE(_paid, 0) > 0;

  RETURN jsonb_build_object(
    'can_access', _can_access,
    'is_in_trial', COALESCE(_in_trial, false),
    'trial_days_left', COALESCE(_trial_days_left, 0),
    'trial_end_date', _trial_end,
    'has_active_subscription', COALESCE(_has_sub, false),
    'subscription_end', _sub_end,
    'subscription_status', COALESCE(_sub_status, 'none'),
    'bonus_tokens', COALESCE(_bonus, 0),
    'paid_tokens', COALESCE(_paid, 0)
  );
END;
$$;
