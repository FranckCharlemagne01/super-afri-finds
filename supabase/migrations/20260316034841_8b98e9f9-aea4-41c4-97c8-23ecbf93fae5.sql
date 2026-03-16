
-- Fix can_insert_products to use correct table (publication_bonus) and columns (used_products)
CREATE OR REPLACE FUNCTION public.can_insert_products(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _in_trial boolean;
  _has_bonus boolean;
  _has_wallet boolean;
BEGIN
  -- Check trial period
  SELECT CASE WHEN p.trial_end_date > now() AND NOT COALESCE(p.trial_used, false) THEN true ELSE false END
  INTO _in_trial
  FROM profiles p WHERE p.user_id = _user_id;

  IF COALESCE(_in_trial, false) THEN RETURN true; END IF;

  -- Check publication bonus (correct table and columns)
  SELECT EXISTS (
    SELECT 1 FROM publication_bonus
    WHERE seller_id = _user_id
      AND is_active = true
      AND expires_at > now()
      AND starts_at <= now()
      AND used_products < max_products
  ) INTO _has_bonus;
  IF _has_bonus THEN RETURN true; END IF;

  -- Check wallet balance
  SELECT EXISTS (
    SELECT 1 FROM seller_tokens
    WHERE seller_id = _user_id AND wallet_balance_fcfa > 0
  ) INTO _has_wallet;
  IF _has_wallet THEN RETURN true; END IF;

  -- Check subscription
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = _user_id AND status = 'active' AND subscription_end > now()
  );
END;
$$;

-- Add RLS policies to publication_bonus so sellers can read their own bonuses
ALTER TABLE public.publication_bonus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own bonuses"
ON public.publication_bonus
FOR SELECT
TO authenticated
USING (auth.uid() = seller_id);

CREATE POLICY "Superadmins can manage all bonuses"
ON public.publication_bonus
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::user_role));
