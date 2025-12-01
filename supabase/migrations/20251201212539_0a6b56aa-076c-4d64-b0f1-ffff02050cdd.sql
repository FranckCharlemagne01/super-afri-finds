-- Ajouter une colonne tsvector pour le full-text search sur les produits
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Créer un index GIN pour la recherche full-text
CREATE INDEX IF NOT EXISTS products_search_vector_idx ON products USING GIN (search_vector);

-- Fonction pour mettre à jour le vecteur de recherche
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
DECLARE
  shop_name_text TEXT := '';
BEGIN
  -- Récupérer le nom de la boutique si shop_id existe
  IF NEW.shop_id IS NOT NULL THEN
    SELECT seller_shops.shop_name INTO shop_name_text
    FROM seller_shops
    WHERE seller_shops.id = NEW.shop_id;
  END IF;

  -- Créer le vecteur de recherche avec pondération :
  -- A = Poids maximum (titre)
  -- B = Poids élevé (description)
  -- C = Poids moyen (catégorie, nom boutique)
  -- D = Poids faible (badge)
  NEW.search_vector := 
    setweight(to_tsvector('french', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('french', COALESCE(shop_name_text, '')), 'C') ||
    setweight(to_tsvector('french', COALESCE(NEW.badge, '')), 'D');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le search_vector
DROP TRIGGER IF EXISTS products_search_vector_update ON products;
CREATE TRIGGER products_search_vector_update
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_search_vector();

-- Mettre à jour les produits existants
UPDATE products SET updated_at = updated_at WHERE id IS NOT NULL;

-- Fonction de recherche optimisée avec fuzzy matching et full-text
CREATE OR REPLACE FUNCTION search_products(
  search_query TEXT,
  user_city TEXT DEFAULT NULL,
  user_country TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  category TEXT,
  images TEXT[],
  seller_id UUID,
  shop_id UUID,
  discount_percentage INTEGER,
  original_price NUMERIC,
  is_flash_sale BOOLEAN,
  badge TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  city TEXT,
  country TEXT,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.category,
    p.images,
    p.seller_id,
    p.shop_id,
    p.discount_percentage,
    p.original_price,
    p.is_flash_sale,
    p.badge,
    p.rating,
    p.reviews_count,
    p.city,
    p.country,
    -- Calcul du score de pertinence avec full-text search
    (
      ts_rank_cd(p.search_vector, plainto_tsquery('french', search_query), 32) * 10 +
      -- Bonus si correspondance exacte dans le titre
      CASE WHEN p.title ILIKE '%' || search_query || '%' THEN 5 ELSE 0 END +
      -- Bonus si correspondance exacte dans la description
      CASE WHEN p.description ILIKE '%' || search_query || '%' THEN 2 ELSE 0 END +
      -- Bonus pour les produits boostés
      CASE WHEN p.is_boosted = TRUE AND p.boosted_until > NOW() THEN 3 ELSE 0 END +
      -- Bonus pour la localisation
      CASE WHEN user_city IS NOT NULL AND p.city = user_city THEN 1 ELSE 0 END
    )::REAL as relevance_score
  FROM products p
  WHERE 
    p.is_active = TRUE
    AND p.is_sold = FALSE
    AND (
      -- Full-text search avec fuzzy matching
      p.search_vector @@ plainto_tsquery('french', search_query)
      OR
      -- Recherche ILIKE pour les correspondances partielles
      p.title ILIKE '%' || search_query || '%'
      OR
      p.description ILIKE '%' || search_query || '%'
      OR
      p.category ILIKE '%' || search_query || '%'
      OR
      -- Recherche dans le nom de boutique
      EXISTS (
        SELECT 1 FROM seller_shops ss
        WHERE ss.id = p.shop_id
        AND ss.shop_name ILIKE '%' || search_query || '%'
      )
    )
  ORDER BY relevance_score DESC, p.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction pour générer des suggestions intelligentes
CREATE OR REPLACE FUNCTION search_suggestions(
  search_query TEXT,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  type TEXT,
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  (
    -- Suggestions de produits
    SELECT 
      p.id,
      p.title,
      'product'::TEXT as type,
      p.category
    FROM products p
    WHERE 
      p.is_active = TRUE
      AND p.is_sold = FALSE
      AND (
        p.search_vector @@ plainto_tsquery('french', search_query)
        OR p.title ILIKE '%' || search_query || '%'
      )
    ORDER BY 
      ts_rank_cd(p.search_vector, plainto_tsquery('french', search_query)) DESC,
      p.title ILIKE search_query || '%' DESC
    LIMIT max_results / 2
  )
  
  UNION ALL
  
  (
    -- Suggestions de catégories distinctes
    SELECT 
      gen_random_uuid() as id,
      p.category as title,
      'category'::TEXT as type,
      p.category
    FROM products p
    WHERE 
      p.is_active = TRUE
      AND p.category ILIKE '%' || search_query || '%'
    GROUP BY p.category
    LIMIT max_results / 2
  );
END;
$$ LANGUAGE plpgsql STABLE;