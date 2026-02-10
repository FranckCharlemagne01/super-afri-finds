
-- Secure function for superadmin to adjust seller token balances
-- Records every adjustment in token_transactions for full audit trail
CREATE OR REPLACE FUNCTION public.admin_adjust_tokens(
  _seller_id uuid,
  _amount integer,
  _reason text DEFAULT 'Ajustement admin'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_balance integer;
  _new_balance integer;
  _tx_type text;
BEGIN
  -- Only superadmins can call this
  IF NOT has_role(auth.uid(), 'superadmin') THEN
    RETURN json_build_object('success', false, 'error', 'Accès refusé');
  END IF;

  -- Validate amount is not zero
  IF _amount = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Le montant ne peut pas être zéro');
  END IF;

  -- Ensure seller_tokens row exists
  PERFORM initialize_seller_tokens(_seller_id);

  -- Get current balance
  SELECT token_balance INTO _current_balance
  FROM seller_tokens
  WHERE seller_id = _seller_id;

  IF _current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Vendeur introuvable dans seller_tokens');
  END IF;

  -- Prevent negative balance
  _new_balance := _current_balance + _amount;
  IF _new_balance < 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Solde insuffisant. Actuel: %s, retrait demandé: %s', _current_balance, abs(_amount))
    );
  END IF;

  -- Determine transaction type
  IF _amount > 0 THEN
    _tx_type := 'admin_credit';
  ELSE
    _tx_type := 'admin_debit';
  END IF;

  -- Update balance
  UPDATE seller_tokens
  SET token_balance = _new_balance,
      paid_tokens_count = COALESCE(paid_tokens_count, 0) + GREATEST(_amount, 0),
      updated_at = now()
  WHERE seller_id = _seller_id;

  -- Record transaction for audit
  INSERT INTO token_transactions (seller_id, transaction_type, tokens_amount, status, payment_method, paystack_reference)
  VALUES (_seller_id, _tx_type, abs(_amount), 'completed', 'admin_manual', _reason);

  RETURN json_build_object(
    'success', true,
    'previous_balance', _current_balance,
    'new_balance', _new_balance,
    'adjustment', _amount
  );
END;
$$;
