
CREATE OR REPLACE FUNCTION public.can_access_seller_features(_user_id uuid)
RETURNS json
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
  _has_bonus boolean;
  _has_wallet boolean;
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

  -- Check publication bonuses
  SELECT EXISTS (
    SELECT 1 FROM publication_bonuses
    WHERE seller_id = _user_id AND is_active = true AND expires_at > now() AND starts_at <= now() AND products_used < max_products
  ) INTO _has_bonus;

  -- Check wallet
  SELECT EXISTS (
    SELECT 1 FROM seller_tokens WHERE seller_id = _user_id AND wallet_balance_fcfa > 0
  ) INTO _has_wallet;

  _can_access := COALESCE(_in_trial, false) 
    OR COALESCE(_has_sub, false)
    OR COALESCE(_has_bonus, false)
    OR COALESCE(_has_wallet, false);

  RETURN jsonb_build_object(
    'can_access', _can_access,
    'is_in_trial', COALESCE(_in_trial, false),
    'trial_days_left', COALESCE(_trial_days_left, 0),
    'trial_end_date', _trial_end,
    'has_active_subscription', COALESCE(_has_sub, false),
    'subscription_end', _sub_end,
    'subscription_status', COALESCE(_sub_status, 'none'),
    'has_bonus', COALESCE(_has_bonus, false),
    'has_wallet', COALESCE(_has_wallet, false)
  );
END;
$$;
