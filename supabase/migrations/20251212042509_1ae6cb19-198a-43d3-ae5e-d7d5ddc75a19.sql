-- Annuler le DEFAULT 10 sur stock_quantity - restaurer à NULL (pas de valeur par défaut)
ALTER TABLE public.products ALTER COLUMN stock_quantity DROP DEFAULT;

-- Note: Les produits existants qui avaient vraiment 0 en stock ne sont pas restaurés
-- car on ne peut pas savoir lesquels étaient intentionnellement à 0