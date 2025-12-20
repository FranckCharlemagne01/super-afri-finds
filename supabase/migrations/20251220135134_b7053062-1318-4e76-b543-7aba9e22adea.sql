-- 1) HARD RESET images for ALL products (irreversible, as requested)
UPDATE public.products
SET images = ARRAY[]::text[], updated_at = now();

-- 2) Allow product INSERT when seller has trial OR active subscription OR token balance > 0
CREATE OR REPLACE FUNCTION public.can_insert_products(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  profile_record RECORD;
  subscription_record RECORD;
  token_balance_int integer;
BEGIN
  -- Must be the same authenticated user
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN FALSE;
  END IF;

  SELECT trial_end_date, trial_used
  INTO profile_record
  FROM public.profiles
  WHERE user_id = _user_id;

  SELECT status, subscription_end
  INTO subscription_record
  FROM public.subscriptions
  WHERE user_id = _user_id;

  -- Make sure expired free tokens are not counted
  PERFORM public.expire_free_tokens();

  SELECT COALESCE(token_balance, 0)
  INTO token_balance_int
  FROM public.seller_tokens
  WHERE seller_id = _user_id;

  RETURN (
    (
      COALESCE(profile_record.trial_used, false) = false
      AND profile_record.trial_end_date IS NOT NULL
      AND profile_record.trial_end_date > now()
    )
    OR (
      subscription_record.status = 'active'
      AND subscription_record.subscription_end IS NOT NULL
      AND subscription_record.subscription_end > now()
    )
    OR (COALESCE(token_balance_int, 0) > 0)
  );
END;
$$;

-- Replace the restrictive INSERT policy on products
DROP POLICY IF EXISTS "Sellers can insert products during trial or subscription" ON public.products;

CREATE POLICY "Sellers can insert products with trial, subscription, or tokens"
ON public.products
FOR INSERT
WITH CHECK (
  auth.uid() = seller_id
  AND public.can_insert_products(auth.uid())
);

-- 3) Fix token consumption: if not trial/subscription, deduct 1 token (simple & stable)
CREATE OR REPLACE FUNCTION public.consume_token_for_publication(_seller_id uuid, _product_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  profile_record RECORD;
  subscription_record RECORD;
  is_in_trial boolean;
  has_active_subscription boolean;
  current_balance integer;
  free_tokens integer;
  paid_tokens integer;
  tokens_to_deduct_free integer := 0;
  tokens_to_deduct_paid integer := 0;
BEGIN
  -- SECURITY: Verify authentication
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'PGRST';
  END IF;

  -- SECURITY: Verify user owns this seller_id
  IF current_user_id <> _seller_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only publish for your own account' USING ERRCODE = 'PGRST';
  END IF;

  -- Trial/subscription checks
  SELECT trial_end_date, trial_used
  INTO profile_record
  FROM public.profiles
  WHERE user_id = _seller_id;

  SELECT status, subscription_end
  INTO subscription_record
  FROM public.subscriptions
  WHERE user_id = _seller_id;

  is_in_trial := (
    COALESCE(profile_record.trial_used, false) = false
    AND profile_record.trial_end_date IS NOT NULL
    AND profile_record.trial_end_date > now()
  );

  has_active_subscription := (
    subscription_record.status = 'active'
    AND subscription_record.subscription_end IS NOT NULL
    AND subscription_record.subscription_end > now()
  );

  -- 🎁 During trial or subscription: no token deduction
  IF is_in_trial OR has_active_subscription THEN
    IF _product_id IS NOT NULL THEN
      INSERT INTO public.token_transactions (
        seller_id,
        transaction_type,
        tokens_amount,
        product_id,
        status
      ) VALUES (
        _seller_id,
        CASE WHEN is_in_trial THEN 'trial_free' ELSE 'subscription_free' END,
        0,
        _product_id,
        'completed'
      );
    END IF;
    RETURN TRUE;
  END IF;

  -- No trial/subscription: deduct 1 token
  PERFORM public.expire_free_tokens();

  -- Ensure row exists
  INSERT INTO public.seller_tokens (seller_id, token_balance, free_tokens_count, paid_tokens_count)
  VALUES (_seller_id, 0, 0, 0)
  ON CONFLICT (seller_id) DO NOTHING;

  SELECT token_balance, COALESCE(free_tokens_count, 0), COALESCE(paid_tokens_count, 0)
  INTO current_balance, free_tokens, paid_tokens
  FROM public.seller_tokens
  WHERE seller_id = _seller_id;

  IF current_balance IS NULL OR current_balance < 1 THEN
    RETURN FALSE;
  END IF;

  IF free_tokens >= 1 THEN
    tokens_to_deduct_free := 1;
    tokens_to_deduct_paid := 0;
  ELSE
    tokens_to_deduct_free := 0;
    tokens_to_deduct_paid := 1;
  END IF;

  UPDATE public.seller_tokens
  SET
    free_tokens_count = GREATEST(0, COALESCE(free_tokens_count, 0) - tokens_to_deduct_free),
    paid_tokens_count = GREATEST(0, COALESCE(paid_tokens_count, 0) - tokens_to_deduct_paid),
    token_balance = GREATEST(0, COALESCE(token_balance, 0) - 1),
    updated_at = now()
  WHERE seller_id = _seller_id;

  -- Log token consumption
  INSERT INTO public.token_transactions (
    seller_id,
    transaction_type,
    tokens_amount,
    product_id,
    status
  ) VALUES (
    _seller_id,
    'publication',
    -1,
    _product_id,
    'completed'
  );

  RETURN TRUE;
END;
$$;
