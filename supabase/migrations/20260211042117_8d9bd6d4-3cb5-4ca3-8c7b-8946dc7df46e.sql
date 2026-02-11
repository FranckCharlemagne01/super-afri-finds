
CREATE OR REPLACE FUNCTION public.admin_adjust_tokens(p_seller uuid, p_amount integer, p_reason text DEFAULT ''::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_bonus int;
  _current_free int;
  _current_paid int;
  _current_total int;
  _abs_amount int;
  _remaining int;
  _deduct_bonus int;
  _deduct_free int;
  _deduct_paid int;
  _tx_type text;
BEGIN
  -- Vérifier que l'appelant est superadmin
  IF NOT has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  -- Initialiser seller_tokens si inexistant
  INSERT INTO seller_tokens (seller_id, token_balance, bonus_tokens_count, free_tokens_count, paid_tokens_count)
  VALUES (p_seller, 0, 0, 0, 0)
  ON CONFLICT (seller_id) DO NOTHING;

  -- Lire les soldes actuels
  SELECT COALESCE(bonus_tokens_count, 0), COALESCE(free_tokens_count, 0), COALESCE(paid_tokens_count, 0), token_balance
  INTO _current_bonus, _current_free, _current_paid, _current_total
  FROM seller_tokens WHERE seller_id = p_seller FOR UPDATE;

  IF p_amount > 0 THEN
    -- CRÉDIT: ajouter aux bonus
    UPDATE seller_tokens SET
      bonus_tokens_count = COALESCE(bonus_tokens_count, 0) + p_amount,
      token_balance = token_balance + p_amount,
      updated_at = now()
    WHERE seller_id = p_seller;
    _tx_type := 'admin_credit';
  ELSIF p_amount < 0 THEN
    -- DÉBIT: consommer bonus → free → paid
    _abs_amount := ABS(p_amount);
    
    IF _current_total < _abs_amount THEN
      RAISE EXCEPTION 'Solde total insuffisant (% disponible, % demandé)', _current_total, _abs_amount;
    END IF;

    _remaining := _abs_amount;

    -- 1. Bonus
    _deduct_bonus := LEAST(_remaining, _current_bonus);
    _remaining := _remaining - _deduct_bonus;

    -- 2. Free
    _deduct_free := LEAST(_remaining, _current_free);
    _remaining := _remaining - _deduct_free;

    -- 3. Paid
    _deduct_paid := LEAST(_remaining, _current_paid);
    _remaining := _remaining - _deduct_paid;

    UPDATE seller_tokens SET
      bonus_tokens_count = COALESCE(bonus_tokens_count, 0) - _deduct_bonus,
      free_tokens_count = COALESCE(free_tokens_count, 0) - _deduct_free,
      paid_tokens_count = COALESCE(paid_tokens_count, 0) - _deduct_paid,
      token_balance = token_balance - _abs_amount,
      updated_at = now()
    WHERE seller_id = p_seller;
    _tx_type := 'admin_debit';
  ELSE
    RETURN;
  END IF;

  -- Enregistrer la transaction
  INSERT INTO token_transactions (seller_id, transaction_type, tokens_amount, status, payment_method)
  VALUES (p_seller, _tx_type, p_amount, 'completed', p_reason);
END;
$$;
