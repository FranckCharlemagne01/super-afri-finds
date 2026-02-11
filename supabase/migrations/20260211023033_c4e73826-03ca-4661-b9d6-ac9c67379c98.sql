
-- 1. Normaliser les anciens crédits admin en admin_credit
-- On identifie les transactions qui étaient des crédits admin historiques
UPDATE token_transactions
SET transaction_type = 'admin_credit'
WHERE transaction_type IN ('credit', 'boost', 'trial_boost')
  AND transaction_type NOT IN ('admin_credit', 'admin_debit', 'purchase', 'usage')
  AND tokens_amount > 0;

-- 2. Normaliser les anciens retraits admin en admin_debit  
UPDATE token_transactions
SET transaction_type = 'admin_debit'
WHERE transaction_type IN ('debit')
  AND transaction_type NOT IN ('admin_credit', 'admin_debit', 'purchase', 'usage')
  AND tokens_amount < 0;

-- 3. Recalculer bonus_tokens_count pour chaque vendeur
-- bonus = somme des admin_credit + admin_debit (les debits sont négatifs)
UPDATE seller_tokens st
SET bonus_tokens_count = GREATEST(0, COALESCE((
  SELECT SUM(
    CASE 
      WHEN tt.transaction_type = 'admin_credit' THEN tt.tokens_amount
      WHEN tt.transaction_type = 'admin_debit' THEN tt.tokens_amount  -- already negative
      ELSE 0
    END
  )
  FROM token_transactions tt
  WHERE tt.seller_id = st.seller_id
    AND tt.transaction_type IN ('admin_credit', 'admin_debit')
    AND tt.status = 'completed'
), 0)),
-- Recalculer aussi le token_balance total pour cohérence
token_balance = GREATEST(0,
  COALESCE(st.free_tokens_count, 0) + 
  COALESCE(st.paid_tokens_count, 0) + 
  GREATEST(0, COALESCE((
    SELECT SUM(
      CASE 
        WHEN tt.transaction_type = 'admin_credit' THEN tt.tokens_amount
        WHEN tt.transaction_type = 'admin_debit' THEN tt.tokens_amount
        ELSE 0
      END
    )
    FROM token_transactions tt
    WHERE tt.seller_id = st.seller_id
      AND tt.transaction_type IN ('admin_credit', 'admin_debit')
      AND tt.status = 'completed'
  ), 0))
);
