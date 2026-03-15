
-- Drop the dependent policy first, then recreate can_insert_products, then recreate the policy
DROP POLICY IF EXISTS "Sellers can insert products with images and valid subscription" ON products;

DROP FUNCTION IF EXISTS public.can_insert_products(uuid);

CREATE OR REPLACE FUNCTION public.can_insert_products(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _in_trial boolean;
  _has_bonus boolean;
  _has_wallet boolean;
  _free_publish_until timestamptz;
BEGIN
  -- Check trial period
  SELECT CASE WHEN p.trial_end_date > now() AND NOT COALESCE(p.trial_used, false) THEN true ELSE false END,
         p.free_publish_until
  INTO _in_trial, _free_publish_until
  FROM profiles p WHERE p.user_id = _user_id;

  IF COALESCE(_in_trial, false) THEN RETURN true; END IF;

  -- Check free_publish_until (legacy bonus)
  IF _free_publish_until IS NOT NULL AND _free_publish_until > now() THEN RETURN true; END IF;

  -- Check publication bonuses (new system)
  SELECT EXISTS (
    SELECT 1 FROM publication_bonuses
    WHERE seller_id = _user_id
      AND is_active = true
      AND expires_at > now()
      AND starts_at <= now()
      AND products_used < max_products
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

-- Recreate the RLS policy
CREATE POLICY "Sellers can insert products with images and valid subscription"
  ON products FOR INSERT
  TO public
  WITH CHECK (
    (auth.uid() = seller_id)
    AND can_insert_products(auth.uid())
    AND (images IS NOT NULL)
    AND (array_length(images, 1) > 0)
  );

-- Create trigger for trial bonus on new sellers
CREATE OR REPLACE FUNCTION public.create_trial_bonus_for_new_seller()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'seller' AND (OLD IS NULL OR OLD.role IS DISTINCT FROM 'seller') THEN
    INSERT INTO publication_bonuses (seller_id, bonus_type, is_active, starts_at, expires_at, max_products, reason)
    VALUES (NEW.user_id, 'trial', true, now(), now() + interval '7 days', 10, 'Bonus d''essai – 7 jours de publication gratuite')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_trial_bonus ON profiles;
CREATE TRIGGER trg_create_trial_bonus
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_trial_bonus_for_new_seller();
