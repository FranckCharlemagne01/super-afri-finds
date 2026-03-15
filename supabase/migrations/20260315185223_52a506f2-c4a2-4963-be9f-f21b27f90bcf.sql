
-- Drop and recreate can_access_seller_features with updated return
DROP FUNCTION IF EXISTS public.can_access_seller_features(uuid);

CREATE OR REPLACE FUNCTION public.can_access_seller_features(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
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
  _free_publish_until timestamptz;
BEGIN
  SELECT 
    CASE WHEN p.trial_end_date > now() AND NOT COALESCE(p.trial_used, false) THEN true ELSE false END,
    GREATEST(0, EXTRACT(DAY FROM (p.trial_end_date - now()))::integer),
    p.trial_end_date,
    p.free_publish_until
  INTO _in_trial, _trial_days_left, _trial_end, _free_publish_until
  FROM profiles p WHERE p.user_id = _user_id;

  SELECT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = _user_id AND status = 'active' AND subscription_end > now()) INTO _has_sub;

  SELECT subscription_end, status INTO _sub_end, _sub_status
  FROM subscriptions WHERE user_id = _user_id ORDER BY created_at DESC LIMIT 1;

  SELECT COALESCE(bonus_tokens_count, 0), COALESCE(paid_tokens_count, 0)
  INTO _bonus, _paid
  FROM seller_tokens WHERE seller_id = _user_id;

  _can_access := COALESCE(_in_trial, false) 
    OR COALESCE(_has_sub, false) 
    OR COALESCE(_bonus, 0) > 0 
    OR COALESCE(_paid, 0) > 0
    OR (_free_publish_until IS NOT NULL AND _free_publish_until > now());

  RETURN jsonb_build_object(
    'can_access', _can_access,
    'is_in_trial', COALESCE(_in_trial, false),
    'trial_days_left', COALESCE(_trial_days_left, 0),
    'trial_end_date', _trial_end,
    'has_active_subscription', COALESCE(_has_sub, false),
    'subscription_end', _sub_end,
    'subscription_status', COALESCE(_sub_status, 'none'),
    'bonus_tokens', COALESCE(_bonus, 0),
    'paid_tokens', COALESCE(_paid, 0),
    'free_publish_until', _free_publish_until
  );
END;
$$;

-- Create admin_grant_bonus RPC
CREATE OR REPLACE FUNCTION public.admin_grant_bonus(
  p_seller_id uuid,
  p_bonus_type text,
  p_value integer,
  p_reason text DEFAULT 'Bonus admin'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
  _new_date timestamptz;
BEGIN
  SELECT has_role(auth.uid(), 'superadmin'::user_role) INTO _is_admin;
  IF NOT _is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;

  IF p_bonus_type = 'free_publish_days' THEN
    UPDATE profiles
    SET free_publish_until = GREATEST(COALESCE(free_publish_until, now()), now()) + (p_value || ' days')::interval
    WHERE user_id = p_seller_id;

    SELECT free_publish_until INTO _new_date FROM profiles WHERE user_id = p_seller_id;

    INSERT INTO token_transactions (seller_id, transaction_type, tokens_amount, status, payment_method)
    VALUES (p_seller_id, 'admin_credit', 0, 'completed', 'Bonus: ' || p_value || ' jours publication gratuite - ' || p_reason);

    RETURN jsonb_build_object('success', true, 'type', 'free_publish_days', 'days', p_value, 'until', _new_date);

  ELSIF p_bonus_type = 'wallet_credit' THEN
    UPDATE seller_tokens
    SET wallet_balance_fcfa = wallet_balance_fcfa + p_value,
        updated_at = now()
    WHERE seller_id = p_seller_id;

    IF NOT FOUND THEN
      INSERT INTO seller_tokens (seller_id, token_balance, wallet_balance_fcfa)
      VALUES (p_seller_id, 0, p_value);
    END IF;

    INSERT INTO wallet_transactions (user_id, transaction_type, amount, status, description, currency)
    VALUES (p_seller_id, 'admin_credit', p_value, 'completed', 'Bonus admin: ' || p_reason, 'XOF');

    RETURN jsonb_build_object('success', true, 'type', 'wallet_credit', 'amount', p_value);

  ELSIF p_bonus_type = 'trial_extension' THEN
    UPDATE profiles
    SET trial_end_date = GREATEST(COALESCE(trial_end_date, now()), now()) + (p_value || ' days')::interval,
        trial_used = false
    WHERE user_id = p_seller_id;

    SELECT trial_end_date INTO _new_date FROM profiles WHERE user_id = p_seller_id;

    INSERT INTO token_transactions (seller_id, transaction_type, tokens_amount, status, payment_method)
    VALUES (p_seller_id, 'admin_credit', 0, 'completed', 'Extension essai: ' || p_value || ' jours - ' || p_reason);

    RETURN jsonb_build_object('success', true, 'type', 'trial_extension', 'days', p_value, 'until', _new_date);

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Type de bonus invalide');
  END IF;
END;
$$;
