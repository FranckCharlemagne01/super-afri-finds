-- Reclasser les produits avec catégorie vide dans "autres" (mode-vetements par défaut)
UPDATE products 
SET category = 'vetements-homme' 
WHERE category = '' OR category IS NULL;

-- Reclasser "mode-homme" (ancien slug parent) vers le sous-slug correct
UPDATE products SET category = 'vetements-homme' WHERE category = 'mode-homme';
UPDATE products SET category = 'vetements-femme' WHERE category = 'mode-femme';
UPDATE products SET category = 'vetements-bebe' WHERE category = 'enfants-bebes';
UPDATE products SET category = 'telephones-portables-accessoires' WHERE category = 'technologie-electronique';
UPDATE products SET category = 'maquillage' WHERE category = 'beaute-cosmetique';
UPDATE products SET category = 'cuisine-ustensiles' WHERE category = 'maison-vie-quotidienne' AND title ILIKE '%cuisine%';
UPDATE products SET category = 'meubles-decoration-interieure' WHERE category = 'maison-vie-quotidienne' AND title ILIKE '%meuble%';
UPDATE products SET category = 'pieces-accessoires-auto' WHERE category = 'auto-moto';
UPDATE products SET category = 'vetements-sport' WHERE category = 'sport-sante-bien-etre';
UPDATE products SET category = 'produits-locaux-africains' WHERE category = 'alimentation-epicerie';
UPDATE products SET category = 'sacs-ceintures-portefeuilles' WHERE category = 'accessoires-lifestyle';
UPDATE products SET category = 'bijoux-montres-femme' WHERE category = 'montres-bijoux';