-- Update the ensure_seller_trial_tokens function with STRICT conditional logic
-- Rule: Give 100 free tokens (28 days) ONLY when balance = 0 AND never received before

CREATE OR REPLACE FUNCTION public.ensure_seller_trial_tokens(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance integer;
  v_already_received boolean;
  v_result jsonb;
BEGIN
  -- Check if user has already received free tokens (anti-duplication flag)
  SELECT COALESCE(trial_bonus_tokens_given, false)
  INTO v_already_received
  FROM profiles
  WHERE user_id = _user_id;
  
  -- If already received free tokens, do nothing
  IF v_already_received = true THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'bonus_already_given',
      'message', 'Free tokens already received once'
    );
  END IF;
  
  -- Get current token balance
  SELECT COALESCE(token_balance, 0)
  INTO v_current_balance
  FROM seller_tokens
  WHERE seller_id = _user_id;
  
  -- If no record exists, balance is 0
  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;
  
  -- STRICT RULE: Only give tokens if balance is EXACTLY 0
  IF v_current_balance > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_has_tokens',
      'current_balance', v_current_balance,
      'message', 'User already has tokens, no free tokens given'
    );
  END IF;
  
  -- Balance = 0 AND never received before: Allocate 100 free tokens
  INSERT INTO seller_tokens (seller_id, token_balance, free_tokens_count, free_tokens_expires_at, paid_tokens_count)
  VALUES (
    _user_id,
    100,
    100,
    now() + interval '28 days',
    0
  )
  ON CONFLICT (seller_id) DO UPDATE SET
    token_balance = 100,
    free_tokens_count = 100,
    free_tokens_expires_at = now() + interval '28 days',
    updated_at = now();
  
  -- Mark as received to prevent future duplicates
  UPDATE profiles
  SET trial_bonus_tokens_given = true,
      updated_at = now()
  WHERE user_id = _user_id;
  
  -- Log the transaction
  INSERT INTO token_transactions (seller_id, transaction_type, tokens_amount, status)
  VALUES (_user_id, 'trial_bonus', 100, 'completed');
  
  RETURN jsonb_build_object(
    'success', true,
    'reason', 'tokens_allocated',
    'tokens_amount', 100,
    'expires_in_days', 28,
    'message', '100 free tokens allocated, valid for 28 days'
  );
END;
$$;