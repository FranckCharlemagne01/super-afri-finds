-- Ajouter le champ is_sold à la table products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT false;

-- Créer un index pour optimiser les requêtes sur is_sold
CREATE INDEX IF NOT EXISTS idx_products_is_sold ON public.products(is_sold);

-- Mettre automatiquement is_sold à true si le stock atteint 0
CREATE OR REPLACE FUNCTION public.auto_mark_sold_on_stock_zero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si le stock atteint 0, marquer comme vendu
  IF NEW.stock_quantity = 0 THEN
    NEW.is_sold := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger pour auto-marquer comme vendu
DROP TRIGGER IF EXISTS trigger_auto_mark_sold ON public.products;
CREATE TRIGGER trigger_auto_mark_sold
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_mark_sold_on_stock_zero();