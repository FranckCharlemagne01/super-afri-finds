-- Supprimer le trigger automatique qui marque les produits comme vendus
-- Ce trigger empêche les vendeurs de contrôler le statut "Vendu"
DROP TRIGGER IF EXISTS trigger_auto_mark_sold ON public.products;

-- Supprimer la fonction associée
DROP FUNCTION IF EXISTS public.auto_mark_sold_on_stock_zero();

-- Le statut is_sold sera désormais contrôlé uniquement par le vendeur
-- via le dialogue de confirmation après livraison