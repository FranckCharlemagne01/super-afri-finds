
ALTER TABLE public.token_transactions DROP CONSTRAINT IF EXISTS token_transactions_transaction_type_check;
ALTER TABLE public.token_transactions ADD CONSTRAINT token_transactions_transaction_type_check 
  CHECK (transaction_type IN ('purchase', 'usage', 'boost', 'trial_bonus', 'admin_credit', 'admin_debit', 'refund', 'wallet_recharge', 'spend', 'credit'));
