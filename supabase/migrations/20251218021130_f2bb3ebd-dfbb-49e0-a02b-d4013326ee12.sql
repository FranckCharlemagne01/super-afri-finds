-- Désactiver les produits avec images vides pour éviter les affichages cassés
UPDATE public.products
SET is_active = false, updated_at = now()
WHERE cardinality(images) = 0;