-- Update consume_token_for_publication to skip deduction during trial
CREATE OR REPLACE FUNCTION public.consume_token_for_publication(_seller_id uuid, _product_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_balance INTEGER;
  free_tokens INTEGER;
  paid_tokens INTEGER;
  profile_record RECORD;
  subscription_record RECORD;
  is_in_trial BOOLEAN;
  has_active_subscription BOOLEAN;
BEGIN
  -- SECURITY: Verify authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'PGRST';
  END IF;
  
  -- Check if user is in trial or has active subscription
  SELECT trial_end_date, trial_used
  INTO profile_record
  FROM profiles
  WHERE user_id = _seller_id;
  
  SELECT status, subscription_end
  INTO subscription_record
  FROM subscriptions
  WHERE user_id = _seller_id;
  
  is_in_trial := (
    profile_record.trial_used = false 
    AND profile_record.trial_end_date IS NOT NULL 
    AND profile_record.trial_end_date > now()
  );
  
  has_active_subscription := (
    subscription_record.status = 'active' 
    AND subscription_record.subscription_end IS NOT NULL 
    AND subscription_record.subscription_end > now()
  );
  
  -- 🎁 During trial: NO token deduction, just allow publication
  IF is_in_trial THEN
    -- Log the free publication during trial
    IF _product_id IS NOT NULL THEN
      INSERT INTO public.token_transactions (
        seller_id,
        transaction_type,
        tokens_amount,
        product_id,
        status
      ) VALUES (
        _seller_id,
        'trial_free',
        0,
        _product_id,
        'completed'
      );
    END IF;
    RETURN TRUE;
  END IF;
  
  -- With active subscription: NO token deduction
  IF has_active_subscription THEN
    IF _product_id IS NOT NULL THEN
      INSERT INTO public.token_transactions (
        seller_id,
        transaction_type,
        tokens_amount,
        product_id,
        status
      ) VALUES (
        _seller_id,
        'subscription_free',
        0,
        _product_id,
        'completed'
      );
    END IF;
    RETURN TRUE;
  END IF;
  
  -- No trial, no subscription: BLOCK publication
  RETURN FALSE;
END;
$$;

-- Update boost_product to check trial/subscription status
CREATE OR REPLACE FUNCTION public.boost_product(_seller_id uuid, _product_id uuid, _duration_hours integer DEFAULT 168)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_balance INTEGER;
  free_tokens INTEGER;
  paid_tokens INTEGER;
  boost_cost INTEGER := 2;
  tokens_to_deduct_free INTEGER := 0;
  tokens_to_deduct_paid INTEGER := 0;
  current_user_id UUID;
  profile_record RECORD;
  subscription_record RECORD;
  is_in_trial BOOLEAN;
  has_active_subscription BOOLEAN;
BEGIN
  -- SECURITY: Explicit authentication check
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'PGRST';
  END IF;
  
  -- SECURITY: Verify user owns this seller_id
  IF current_user_id != _seller_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only boost your own products' USING ERRCODE = 'PGRST';
  END IF;
  
  -- Check trial/subscription status
  SELECT trial_end_date, trial_used
  INTO profile_record
  FROM profiles
  WHERE user_id = _seller_id;
  
  SELECT status, subscription_end
  INTO subscription_record
  FROM subscriptions
  WHERE user_id = _seller_id;
  
  is_in_trial := (
    profile_record.trial_used = false 
    AND profile_record.trial_end_date IS NOT NULL 
    AND profile_record.trial_end_date > now()
  );
  
  has_active_subscription := (
    subscription_record.status = 'active' 
    AND subscription_record.subscription_end IS NOT NULL 
    AND subscription_record.subscription_end > now()
  );
  
  -- 🎁 During trial or subscription: FREE boost
  IF is_in_trial OR has_active_subscription THEN
    -- Activer le boost sur le produit
    UPDATE public.products
    SET is_boosted = TRUE,
        boosted_at = now(),
        boosted_until = now() + (_duration_hours || ' hours')::INTERVAL,
        updated_at = now()
    WHERE id = _product_id AND seller_id = _seller_id;
    
    -- Log the free boost
    INSERT INTO public.token_transactions (
      seller_id,
      transaction_type,
      tokens_amount,
      product_id,
      status
    ) VALUES (
      _seller_id,
      CASE WHEN is_in_trial THEN 'trial_boost' ELSE 'subscription_boost' END,
      0,
      _product_id,
      'completed'
    );
    
    RETURN TRUE;
  END IF;
  
  -- Without trial/subscription: require tokens (legacy behavior)
  PERFORM public.expire_free_tokens();
  
  SELECT token_balance, free_tokens_count, paid_tokens_count 
  INTO current_balance, free_tokens, paid_tokens
  FROM public.seller_tokens
  WHERE seller_id = _seller_id;
  
  IF current_balance IS NULL OR current_balance < boost_cost THEN
    RETURN FALSE;
  END IF;
  
  IF free_tokens >= boost_cost THEN
    tokens_to_deduct_free := boost_cost;
    tokens_to_deduct_paid := 0;
  ELSIF free_tokens > 0 THEN
    tokens_to_deduct_free := free_tokens;
    tokens_to_deduct_paid := boost_cost - free_tokens;
  ELSE
    tokens_to_deduct_free := 0;
    tokens_to_deduct_paid := boost_cost;
  END IF;
  
  UPDATE public.seller_tokens
  SET 
    free_tokens_count = free_tokens_count - tokens_to_deduct_free,
    paid_tokens_count = paid_tokens_count - tokens_to_deduct_paid,
    token_balance = token_balance - boost_cost,
    updated_at = now()
  WHERE seller_id = _seller_id;
  
  UPDATE public.products
  SET is_boosted = TRUE,
      boosted_at = now(),
      boosted_until = now() + (_duration_hours || ' hours')::INTERVAL,
      updated_at = now()
  WHERE id = _product_id AND seller_id = _seller_id;
  
  INSERT INTO public.token_transactions (
    seller_id,
    transaction_type,
    tokens_amount,
    product_id,
    status
  ) VALUES (
    _seller_id,
    'boost',
    -boost_cost,
    _product_id,
    'completed'
  );
  
  RETURN TRUE;
END;
$$;

-- Update can_access_seller_features to be more robust
CREATE OR REPLACE FUNCTION public.can_access_seller_features(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_record RECORD;
  subscription_record RECORD;
  trial_days_left INTEGER;
  is_in_trial BOOLEAN;
  has_active_subscription BOOLEAN;
BEGIN
  -- Get profile info
  SELECT trial_start_date, trial_end_date, trial_used
  INTO profile_record
  FROM profiles
  WHERE user_id = _user_id;
  
  -- Get subscription info
  SELECT status, subscription_end
  INTO subscription_record
  FROM subscriptions
  WHERE user_id = _user_id;
  
  -- Calculate trial status
  is_in_trial := (
    COALESCE(profile_record.trial_used, false) = false 
    AND profile_record.trial_end_date IS NOT NULL 
    AND profile_record.trial_end_date > now()
  );
  
  -- Calculate days left in trial
  IF is_in_trial AND profile_record.trial_end_date IS NOT NULL THEN
    trial_days_left := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (profile_record.trial_end_date - now())) / 86400))::INTEGER;
  ELSE
    trial_days_left := 0;
  END IF;
  
  -- Check subscription status
  has_active_subscription := (
    subscription_record.status = 'active' 
    AND subscription_record.subscription_end IS NOT NULL 
    AND subscription_record.subscription_end > now()
  );
  
  RETURN jsonb_build_object(
    'can_access', (is_in_trial OR has_active_subscription),
    'is_in_trial', is_in_trial,
    'trial_days_left', trial_days_left,
    'trial_end_date', profile_record.trial_end_date,
    'has_active_subscription', has_active_subscription,
    'subscription_end', subscription_record.subscription_end,
    'subscription_status', COALESCE(subscription_record.status, 'none')
  );
END;
$$;