-- Mettre à jour la valeur par défaut de stock_quantity à 10 au lieu de 0
ALTER TABLE public.products ALTER COLUMN stock_quantity SET DEFAULT 10;

-- Corriger les produits existants avec stock_quantity = 0 ou NULL
UPDATE public.products 
SET stock_quantity = 10 
WHERE stock_quantity IS NULL OR stock_quantity = 0;