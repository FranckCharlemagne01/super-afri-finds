
-- Corriger la contrainte pour inclure tous les types de transaction utilisés par le système
ALTER TABLE public.token_transactions DROP CONSTRAINT token_transactions_transaction_type_check;

ALTER TABLE public.token_transactions ADD CONSTRAINT token_transactions_transaction_type_check 
CHECK (transaction_type = ANY (ARRAY[
  'purchase'::text,       -- Achat de jetons
  'usage'::text,          -- Utilisation pour publication
  'boost'::text,          -- Boost payant (avec jetons)
  'trial_bonus'::text,    -- Bonus d'inscription gratuit
  'trial_boost'::text,    -- Boost gratuit pendant période d'essai
  'subscription_boost'::text,  -- Boost gratuit avec abonnement actif
  'trial_free'::text,     -- Publication gratuite pendant essai
  'subscription_free'::text   -- Publication gratuite avec abonnement
]));
