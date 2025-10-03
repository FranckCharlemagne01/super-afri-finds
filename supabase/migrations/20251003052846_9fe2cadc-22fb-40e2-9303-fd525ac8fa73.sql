-- Ajouter les champs de boost aux produits
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS boosted_at TIMESTAMP WITH TIME ZONE;

-- Ajouter le mode de paiement aux transactions
ALTER TABLE token_transactions
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Créer une fonction pour booster un produit
CREATE OR REPLACE FUNCTION boost_product(_seller_id UUID, _product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
  boost_cost INTEGER := 2;
BEGIN
  -- Vérifier le solde de jetons
  SELECT token_balance INTO current_balance
  FROM public.seller_tokens
  WHERE seller_id = _seller_id;
  
  -- Si pas assez de jetons, retourner false
  IF current_balance IS NULL OR current_balance < boost_cost THEN
    RETURN FALSE;
  END IF;
  
  -- Déduire les jetons
  UPDATE public.seller_tokens
  SET token_balance = token_balance - boost_cost,
      updated_at = now()
  WHERE seller_id = _seller_id;
  
  -- Activer le boost sur le produit (7 jours)
  UPDATE public.products
  SET is_boosted = TRUE,
      boosted_at = now(),
      boosted_until = now() + INTERVAL '7 days',
      updated_at = now()
  WHERE id = _product_id AND seller_id = _seller_id;
  
  -- Enregistrer la transaction
  INSERT INTO public.token_transactions (
    seller_id,
    transaction_type,
    tokens_amount,
    product_id,
    status
  ) VALUES (
    _seller_id,
    'boost',
    -boost_cost,
    _product_id,
    'completed'
  );
  
  RETURN TRUE;
END;
$$;

-- Créer une fonction pour vérifier si un produit est boosté
CREATE OR REPLACE FUNCTION is_product_boosted(_product_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN is_boosted = TRUE AND boosted_until > now() THEN TRUE
    ELSE FALSE
  END
  FROM products
  WHERE id = _product_id;
$$;