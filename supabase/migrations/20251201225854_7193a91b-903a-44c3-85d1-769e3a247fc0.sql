-- Migration pour ajouter des dates de fin aux produits en offre spéciale existants
-- Cette migration met à jour les produits boostés ou en flash sale qui n'ont pas encore de date de fin

-- Mettre à jour les produits boostés sans date de fin (ajouter 24h à partir de maintenant)
UPDATE products
SET 
  boosted_until = NOW() + INTERVAL '24 hours',
  boosted_at = COALESCE(boosted_at, NOW())
WHERE 
  (is_boosted = true OR is_flash_sale = true)
  AND boosted_until IS NULL
  AND is_active = true;

-- Créer un commentaire pour documenter la structure
COMMENT ON COLUMN products.boosted_until IS 'Date de fin de l''offre spéciale (boost ou flash sale). Utilisé pour le compte à rebours.';
COMMENT ON COLUMN products.boosted_at IS 'Date de début du boost/offre spéciale';
COMMENT ON COLUMN products.is_boosted IS 'Indique si le produit est actuellement boosté (offre spéciale)';
COMMENT ON COLUMN products.is_flash_sale IS 'Indique si le produit est en vente flash (offre spéciale)';
