-- RESET TOTAL des images produits - Mise à zéro de toutes les images
-- Cela permet de repartir de zéro avec un état propre

UPDATE public.products
SET images = ARRAY[]::text[],
    updated_at = now();

-- Commentaire: Ce reset ne touche PAS aux autres colonnes des produits
-- Les vendeurs devront réuploader leurs images via le système de upload sécurisé