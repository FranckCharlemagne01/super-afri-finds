-- Table pour les jetons des vendeurs
CREATE TABLE public.seller_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  token_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seller_id)
);

-- Table pour l'historique des transactions de jetons
CREATE TABLE public.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage')),
  tokens_amount INTEGER NOT NULL,
  price_paid NUMERIC,
  paystack_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  product_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour seller_tokens
CREATE POLICY "Sellers can view their own tokens"
  ON public.seller_tokens
  FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert their own tokens"
  ON public.seller_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own tokens"
  ON public.seller_tokens
  FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Superadmins can manage all tokens"
  ON public.seller_tokens
  FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::user_role));

-- RLS Policies pour token_transactions
CREATE POLICY "Sellers can view their own transactions"
  ON public.token_transactions
  FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert their own transactions"
  ON public.token_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Superadmins can manage all transactions"
  ON public.token_transactions
  FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::user_role));

-- Fonction pour initialiser les jetons d'un vendeur
CREATE OR REPLACE FUNCTION public.initialize_seller_tokens(_seller_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.seller_tokens (seller_id, token_balance)
  VALUES (_seller_id, 0)
  ON CONFLICT (seller_id) DO NOTHING;
END;
$$;

-- Fonction pour consommer un jeton lors de la publication
CREATE OR REPLACE FUNCTION public.consume_token_for_publication(_seller_id UUID, _product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Vérifier le solde de jetons
  SELECT token_balance INTO current_balance
  FROM public.seller_tokens
  WHERE seller_id = _seller_id;
  
  -- Si pas de jetons disponibles, retourner false
  IF current_balance IS NULL OR current_balance < 1 THEN
    RETURN FALSE;
  END IF;
  
  -- Déduire un jeton
  UPDATE public.seller_tokens
  SET token_balance = token_balance - 1,
      updated_at = now()
  WHERE seller_id = _seller_id;
  
  -- Enregistrer la transaction
  INSERT INTO public.token_transactions (
    seller_id,
    transaction_type,
    tokens_amount,
    product_id,
    status
  ) VALUES (
    _seller_id,
    'usage',
    -1,
    _product_id,
    'completed'
  );
  
  RETURN TRUE;
END;
$$;

-- Fonction pour ajouter des jetons après achat
CREATE OR REPLACE FUNCTION public.add_tokens_after_purchase(
  _seller_id UUID,
  _tokens_amount INTEGER,
  _price_paid NUMERIC,
  _paystack_reference TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Initialiser les jetons si nécessaire
  INSERT INTO public.seller_tokens (seller_id, token_balance)
  VALUES (_seller_id, 0)
  ON CONFLICT (seller_id) DO NOTHING;
  
  -- Ajouter les jetons
  UPDATE public.seller_tokens
  SET token_balance = token_balance + _tokens_amount,
      updated_at = now()
  WHERE seller_id = _seller_id;
  
  -- Marquer la transaction comme complétée
  UPDATE public.token_transactions
  SET status = 'completed'
  WHERE paystack_reference = _paystack_reference
    AND seller_id = _seller_id;
  
  RETURN TRUE;
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_seller_tokens_updated_at
  BEFORE UPDATE ON public.seller_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();