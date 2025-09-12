-- Mettre à jour la devise par défaut de NGN vers XOF
ALTER TABLE premium_payments 
ALTER COLUMN currency 
SET DEFAULT 'XOF';

-- Mettre à jour les montants existants si nécessaire
UPDATE premium_payments 
SET currency = 'XOF', amount = 500 
WHERE currency = 'NGN' AND amount = 50000;