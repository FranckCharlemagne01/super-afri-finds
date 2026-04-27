
-- ============================================================
-- MIGRATION: WALLET UNIQUE + ESCROW + ANTI-TRICHE
-- ============================================================
-- 1) Publication 100% gratuite
-- 2) Escrow commission à la commande (déjà partiellement présent)
-- 3) Libération gains vendeur à la livraison
-- 4) Conversion jetons existants en FCFA (1 jeton = 100 FCFA)
-- 5) Audit logs immuables sur tous mouvements wallet
-- 6) RLS durci: vendeur ne peut PAS muter wallet_balance_fcfa directement
-- ============================================================

-- ------- 1. PUBLICATION GRATUITE -------
CREATE OR REPLACE FUNCTION public.can_insert_products(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _user_id IS NOT NULL;
$$;

-- ------- 2. AUDIT LOG TABLE -------
CREATE TABLE IF NOT EXISTS public.wallet_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  balance_before numeric NOT NULL DEFAULT 0,
  balance_after numeric NOT NULL DEFAULT 0,
  order_id uuid,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_audit_user ON public.wallet_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_audit_order ON public.wallet_audit_log(order_id);

ALTER TABLE public.wallet_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own audit log" ON public.wallet_audit_log;
CREATE POLICY "Users view own audit log"
ON public.wallet_audit_log FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'superadmin'::user_role));

DROP POLICY IF EXISTS "Block direct insert audit log" ON public.wallet_audit_log;
CREATE POLICY "Block direct insert audit log"
ON public.wallet_audit_log FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Block update audit log" ON public.wallet_audit_log;
CREATE POLICY "Block update audit log"
ON public.wallet_audit_log FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Block delete audit log" ON public.wallet_audit_log;
CREATE POLICY "Block delete audit log"
ON public.wallet_audit_log FOR DELETE USING (false);

-- ------- 3. HELPER LOG -------
CREATE OR REPLACE FUNCTION public.log_wallet_event(
  _user_id uuid, _event_type text, _amount numeric,
  _balance_before numeric, _balance_after numeric,
  _order_id uuid DEFAULT NULL, _reason text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  INSERT INTO public.wallet_audit_log
    (user_id, event_type, amount, balance_before, balance_after, order_id, reason, metadata)
  VALUES (_user_id, _event_type, _amount, _balance_before, _balance_after, _order_id, _reason, _metadata);
$$;

-- ------- 4. RESERVE COMMISSION (BEFORE INSERT order) -------
CREATE OR REPLACE FUNCTION public.reserve_commission_on_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  commission_rate numeric;
  commission numeric;
  current_balance numeric;
BEGIN
  SELECT get_seller_commission_rate(NEW.seller_id) INTO commission_rate;
  commission := GREATEST(ROUND(NEW.total_amount * commission_rate / 100), 200);

  -- Ensure wallet row exists
  INSERT INTO seller_tokens(seller_id, wallet_balance_fcfa)
  VALUES (NEW.seller_id, 0)
  ON CONFLICT (seller_id) DO NOTHING;

  SELECT wallet_balance_fcfa INTO current_balance
  FROM seller_tokens WHERE seller_id = NEW.seller_id FOR UPDATE;

  NEW.commission_amount := commission;

  IF current_balance IS NULL OR current_balance < commission THEN
    NEW.commission_status := 'insufficient';
    RETURN NEW;
  END IF;

  UPDATE seller_tokens
  SET wallet_balance_fcfa = wallet_balance_fcfa - commission, updated_at = now()
  WHERE seller_id = NEW.seller_id;

  NEW.commission_status := 'reserved';

  PERFORM log_wallet_event(
    NEW.seller_id, 'commission_reserved', -commission,
    current_balance, current_balance - commission,
    NEW.id, 'Commission réservée à la création de commande'
  );

  RETURN NEW;
END;
$$;

-- ------- 5. CREDIT SELLER ON DELIVERY (BEFORE UPDATE order) -------
CREATE OR REPLACE FUNCTION public.handle_commission_on_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  current_balance numeric;
  net_earnings numeric;
BEGIN
  IF OLD.status = NEW.status AND OLD.is_confirmed_by_seller IS NOT DISTINCT FROM NEW.is_confirmed_by_seller THEN
    RETURN NEW;
  END IF;

  -- CANCEL: refund reserved commission
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    IF OLD.commission_status = 'reserved' AND OLD.commission_amount > 0 THEN
      SELECT wallet_balance_fcfa INTO current_balance
      FROM seller_tokens WHERE seller_id = NEW.seller_id FOR UPDATE;

      UPDATE seller_tokens
      SET wallet_balance_fcfa = wallet_balance_fcfa + OLD.commission_amount, updated_at = now()
      WHERE seller_id = NEW.seller_id;

      NEW.commission_status := 'refunded';

      PERFORM log_wallet_event(
        NEW.seller_id, 'commission_refunded', OLD.commission_amount,
        current_balance, current_balance + OLD.commission_amount,
        NEW.id, 'Commission remboursée: commande annulée'
      );
    END IF;
  END IF;

  -- DELIVERED: validate commission + credit net earnings
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    SELECT wallet_balance_fcfa INTO current_balance
    FROM seller_tokens WHERE seller_id = NEW.seller_id FOR UPDATE;

    -- Net earnings = total_amount - commission
    net_earnings := NEW.total_amount - COALESCE(NEW.commission_amount, 0);

    UPDATE seller_tokens
    SET wallet_balance_fcfa = wallet_balance_fcfa + net_earnings, updated_at = now()
    WHERE seller_id = NEW.seller_id;

    IF NEW.commission_status = 'reserved' OR NEW.commission_status = 'pending_validation' THEN
      NEW.commission_status := 'validated';
    END IF;

    PERFORM log_wallet_event(
      NEW.seller_id, 'earnings_credited', net_earnings,
      current_balance, current_balance + net_earnings,
      NEW.id, 'Gains crédités: commande livrée'
    );

    INSERT INTO wallet_transactions(user_id, transaction_type, amount, description, reference, status, order_id)
    VALUES (NEW.seller_id, 'sale_earning', net_earnings,
            'Vente livrée: ' || NEW.product_title,
            'order_' || NEW.id::text, 'completed', NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- ------- 6. ATTACH TRIGGERS -------
DROP TRIGGER IF EXISTS trg_reserve_commission ON public.orders;
CREATE TRIGGER trg_reserve_commission
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.reserve_commission_on_order();

DROP TRIGGER IF EXISTS trg_handle_commission ON public.orders;
CREATE TRIGGER trg_handle_commission
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_commission_on_order_update();

-- ------- 7. RECHARGE WALLET (audit) -------
CREATE OR REPLACE FUNCTION public.recharge_wallet(_seller_id uuid, _amount numeric, _paystack_reference text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  current_balance numeric;
BEGIN
  IF _amount <= 0 THEN RETURN false; END IF;

  INSERT INTO seller_tokens(seller_id, wallet_balance_fcfa)
  VALUES (_seller_id, 0)
  ON CONFLICT (seller_id) DO NOTHING;

  SELECT wallet_balance_fcfa INTO current_balance
  FROM seller_tokens WHERE seller_id = _seller_id FOR UPDATE;

  UPDATE seller_tokens
  SET wallet_balance_fcfa = wallet_balance_fcfa + _amount, updated_at = now()
  WHERE seller_id = _seller_id;

  INSERT INTO wallet_transactions(user_id, transaction_type, amount, description, reference, status)
  VALUES (_seller_id, 'recharge', _amount, 'Recharge wallet', _paystack_reference, 'completed');

  PERFORM log_wallet_event(
    _seller_id, 'wallet_recharge', _amount,
    COALESCE(current_balance, 0), COALESCE(current_balance, 0) + _amount,
    NULL, 'Recharge Paystack', jsonb_build_object('reference', _paystack_reference)
  );

  RETURN true;
END;
$$;

-- ------- 8. WITHDRAWAL: refuse si gains liés à commandes non-livrées -------
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  _user_id uuid, _amount numeric, _method text,
  _destination text, _destination_name text DEFAULT NULL
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  current_balance numeric;
  pending_today numeric;
  has_kyc boolean;
BEGIN
  IF _amount < 500 THEN
    RETURN json_build_object('success', false, 'error', 'Montant minimum 500 FCFA');
  END IF;

  SELECT wallet_balance_fcfa INTO current_balance
  FROM seller_tokens WHERE seller_id = _user_id;

  IF current_balance IS NULL OR current_balance < _amount THEN
    RETURN json_build_object('success', false, 'error', 'Solde insuffisant');
  END IF;

  -- KYC check
  SELECT EXISTS(
    SELECT 1 FROM kyc_verifications
    WHERE user_id = _user_id AND status = 'approved'
  ) INTO has_kyc;

  IF NOT has_kyc THEN
    RETURN json_build_object('success', false, 'error', 'Vérification d''identité (KYC) requise pour retirer');
  END IF;

  -- Daily cap 100k if no extra trust signal
  SELECT COALESCE(SUM(amount), 0) INTO pending_today
  FROM withdrawal_requests
  WHERE user_id = _user_id
    AND created_at > now() - interval '24 hours'
    AND status NOT IN ('rejected', 'cancelled');

  IF pending_today + _amount > 100000 THEN
    RETURN json_build_object('success', false, 'error', 'Plafond quotidien 100 000 FCFA atteint');
  END IF;

  -- Reserve funds
  UPDATE seller_tokens
  SET wallet_balance_fcfa = wallet_balance_fcfa - _amount, updated_at = now()
  WHERE seller_id = _user_id;

  INSERT INTO withdrawal_requests(user_id, amount, withdrawal_method, destination_number, destination_name, status)
  VALUES (_user_id, _amount, _method, _destination, _destination_name, 'pending');

  PERFORM log_wallet_event(
    _user_id, 'withdrawal_requested', -_amount,
    current_balance, current_balance - _amount,
    NULL, 'Retrait demandé', jsonb_build_object('method', _method, 'destination', _destination)
  );

  RETURN json_build_object('success', true, 'message', 'Demande de retrait enregistrée');
END;
$$;

-- ------- 9. RLS DURCISSEMENT seller_tokens (block direct UPDATE wallet_balance_fcfa) -------
DROP POLICY IF EXISTS "Sellers can update their own tokens" ON public.seller_tokens;
CREATE POLICY "Sellers cannot mutate wallet directly"
ON public.seller_tokens FOR UPDATE
USING (false);

-- ------- 10. CONVERSION JETONS EXISTANTS -> FCFA (1 jeton = 100 FCFA) -------
DO $$
DECLARE
  r record;
  total_tokens int;
  fcfa_credit numeric;
BEGIN
  FOR r IN SELECT seller_id, COALESCE(token_balance,0) + COALESCE(bonus_tokens_count,0) + COALESCE(free_tokens_count,0) + COALESCE(paid_tokens_count,0) AS total
           FROM seller_tokens WHERE COALESCE(token_balance,0) > 0
  LOOP
    total_tokens := r.total;
    fcfa_credit := total_tokens * 100;

    UPDATE seller_tokens
    SET wallet_balance_fcfa = wallet_balance_fcfa + fcfa_credit,
        token_balance = 0,
        bonus_tokens_count = 0,
        free_tokens_count = 0,
        paid_tokens_count = 0,
        updated_at = now()
    WHERE seller_id = r.seller_id;

    INSERT INTO public.wallet_audit_log
      (user_id, event_type, amount, balance_before, balance_after, reason, metadata)
    VALUES (r.seller_id, 'token_migration', fcfa_credit, 0, fcfa_credit,
            'Conversion jetons → FCFA (1 jeton = 100 FCFA)',
            jsonb_build_object('tokens_converted', total_tokens));
  END LOOP;
END $$;
