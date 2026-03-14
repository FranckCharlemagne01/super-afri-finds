
-- Wallet transactions table for tracking all wallet movements
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale_credit', 'withdrawal', 'refund', 'escrow_release', 'commission_deduction')),
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  description TEXT,
  reference TEXT,
  order_id UUID,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  withdrawal_method TEXT NOT NULL CHECK (withdrawal_method IN ('orange_money', 'mtn_momo', 'wave', 'bank_transfer')),
  destination_number TEXT NOT NULL,
  destination_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled')),
  admin_note TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallet_transactions
CREATE POLICY "Users can view their own wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallet transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage all wallet transactions" ON public.wallet_transactions
  FOR ALL USING (has_role(auth.uid(), 'superadmin'::user_role));

-- RLS policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their pending withdrawal requests" ON public.withdrawal_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

CREATE POLICY "Superadmins can manage all withdrawal requests" ON public.withdrawal_requests
  FOR ALL USING (has_role(auth.uid(), 'superadmin'::user_role));

-- RPC: Get wallet balance (reads from seller_tokens.wallet_balance_fcfa)
CREATE OR REPLACE FUNCTION public.get_wallet_balance(_user_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'balance', COALESCE(st.wallet_balance_fcfa, 0),
    'pending_withdrawals', COALESCE((
      SELECT SUM(wr.amount) FROM withdrawal_requests wr
      WHERE wr.user_id = _user_id AND wr.status IN ('pending', 'approved', 'processing')
    ), 0),
    'pending_escrow', COALESCE((
      SELECT SUM(wt.amount) FROM wallet_transactions wt
      WHERE wt.user_id = _user_id AND wt.status = 'pending' AND wt.transaction_type = 'escrow_release'
    ), 0)
  )
  FROM seller_tokens st
  WHERE st.seller_id = _user_id;
$$;

-- RPC: Request withdrawal with balance check
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  _user_id UUID,
  _amount NUMERIC,
  _method TEXT,
  _destination TEXT,
  _destination_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_balance NUMERIC;
  _pending_withdrawals NUMERIC;
  _available_balance NUMERIC;
  _withdrawal_id UUID;
BEGIN
  -- Get current balance
  SELECT COALESCE(wallet_balance_fcfa, 0) INTO _current_balance
  FROM seller_tokens WHERE seller_id = _user_id;

  IF _current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Portefeuille introuvable');
  END IF;

  -- Get pending withdrawals
  SELECT COALESCE(SUM(amount), 0) INTO _pending_withdrawals
  FROM withdrawal_requests
  WHERE user_id = _user_id AND status IN ('pending', 'approved', 'processing');

  _available_balance := _current_balance - _pending_withdrawals;

  -- Check minimum withdrawal (500 FCFA)
  IF _amount < 500 THEN
    RETURN json_build_object('success', false, 'error', 'Le montant minimum de retrait est de 500 FCFA');
  END IF;

  -- Check sufficient balance
  IF _amount > _available_balance THEN
    RETURN json_build_object('success', false, 'error', 'Solde insuffisant. Disponible: ' || _available_balance || ' FCFA');
  END IF;

  -- Create withdrawal request
  INSERT INTO withdrawal_requests (user_id, amount, withdrawal_method, destination_number, destination_name)
  VALUES (_user_id, _amount, _method, _destination, _destination_name)
  RETURNING id INTO _withdrawal_id;

  -- Log transaction
  INSERT INTO wallet_transactions (user_id, transaction_type, amount, description, status, reference)
  VALUES (_user_id, 'withdrawal', -_amount, 'Demande de retrait via ' || _method, 'pending', _withdrawal_id::text);

  RETURN json_build_object('success', true, 'withdrawal_id', _withdrawal_id, 'message', 'Demande de retrait soumise avec succès');
END;
$$;

-- Indexes
CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);
