
DROP FUNCTION IF EXISTS public.admin_adjust_tokens(uuid, integer, text);

CREATE FUNCTION public.admin_adjust_tokens(p_seller uuid, p_amount integer, p_reason text DEFAULT 'Admin adjustment')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance integer;
  v_tx_type text;
BEGIN
  -- Vérification SuperAdmin via user_roles
  IF NOT has_role(auth.uid(), 'superadmin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied: superadmin only');
  END IF;

  -- Validate amount
  IF p_amount = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount cannot be zero');
  END IF;

  -- Upsert seller_tokens row
  INSERT INTO seller_tokens (seller_id, token_balance, bonus_tokens_count)
  VALUES (p_seller, GREATEST(p_amount, 0), GREATEST(p_amount, 0))
  ON CONFLICT (seller_id) DO UPDATE SET
    token_balance = GREATEST(seller_tokens.token_balance + p_amount, 0),
    bonus_tokens_count = CASE
      WHEN p_amount > 0 THEN COALESCE(seller_tokens.bonus_tokens_count, 0) + p_amount
      ELSE GREATEST(COALESCE(seller_tokens.bonus_tokens_count, 0) + p_amount, 0)
    END,
    updated_at = now();

  -- Get new balance
  SELECT token_balance INTO v_new_balance
  FROM seller_tokens WHERE seller_id = p_seller;

  -- Determine transaction type
  v_tx_type := CASE WHEN p_amount > 0 THEN 'admin_credit' ELSE 'admin_debit' END;

  -- Log in token_transactions
  INSERT INTO token_transactions (seller_id, tokens_amount, transaction_type, status, payment_method)
  VALUES (p_seller, p_amount, v_tx_type, 'completed', p_reason);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;
