-- Désactiver les produits sans images valides
UPDATE products 
SET is_active = false, updated_at = now() 
WHERE id = 'd81e242b-78e9-42a5-b0c7-2ee7c9a5c847';

-- Nettoyer les tableaux d'images vides en les mettant à NULL
UPDATE products 
SET images = NULL 
WHERE images = '{}' OR images = ARRAY[]::text[];