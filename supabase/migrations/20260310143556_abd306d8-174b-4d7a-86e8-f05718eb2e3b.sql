
-- Create recharge_wallet RPC function
CREATE OR REPLACE FUNCTION public.recharge_wallet(
  _seller_id uuid,
  _amount numeric,
  _paystack_reference text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atomically increment wallet balance
  UPDATE public.seller_tokens
  SET wallet_balance_fcfa = wallet_balance_fcfa + _amount,
      updated_at = now()
  WHERE seller_id = _seller_id;

  -- Record the transaction in token_transactions
  INSERT INTO public.token_transactions (
    seller_id, transaction_type, tokens_amount, price_paid, 
    paystack_reference, payment_method, status
  ) VALUES (
    _seller_id, 'wallet_recharge', 0, _amount,
    _paystack_reference, 'paystack', 'completed'
  );

  RETURN true;
END;
$$;

-- Add 'wallet_recharge' to the allowed transaction_type check constraint
-- First drop existing constraint if it exists, then recreate
DO $$
BEGIN
  -- Try to drop the existing check constraint
  ALTER TABLE public.token_transactions DROP CONSTRAINT IF EXISTS token_transactions_transaction_type_check;
  
  -- Add updated check constraint that includes wallet_recharge
  ALTER TABLE public.token_transactions ADD CONSTRAINT token_transactions_transaction_type_check 
    CHECK (transaction_type IN ('purchase', 'consumption', 'bonus', 'refund', 'admin_adjustment', 'trial_bonus', 'wallet_recharge'));
EXCEPTION WHEN others THEN
  -- If constraint doesn't exist or can't be modified, just continue
  NULL;
END $$;
