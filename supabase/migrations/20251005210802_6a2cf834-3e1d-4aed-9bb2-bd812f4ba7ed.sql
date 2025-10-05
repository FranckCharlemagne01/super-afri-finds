-- Supprimer l'ancienne contrainte et la recréer avec les valeurs correctes
ALTER TABLE public.token_transactions 
DROP CONSTRAINT IF EXISTS token_transactions_transaction_type_check;

-- Ajouter la contrainte avec toutes les valeurs valides
ALTER TABLE public.token_transactions
ADD CONSTRAINT token_transactions_transaction_type_check 
CHECK (transaction_type IN ('purchase', 'usage', 'boost', 'trial_bonus'));

-- Vérifier que la fonction handle_new_user fonctionne correctement
-- (pas besoin de la recréer, elle est déjà correcte)