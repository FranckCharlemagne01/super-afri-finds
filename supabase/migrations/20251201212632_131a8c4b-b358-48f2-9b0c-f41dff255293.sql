-- Corriger les fonctions pour sécuriser le search_path

-- 1. Fonction update_product_search_vector avec search_path
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
DECLARE
  shop_name_text TEXT := '';
BEGIN
  IF NEW.shop_id IS NOT NULL THEN
    SELECT seller_shops.shop_name INTO shop_name_text
    FROM seller_shops
    WHERE seller_shops.id = NEW.shop_id;
  END IF;

  NEW.search_vector := 
    setweight(to_tsvector('french', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('french', COALESCE(shop_name_text, '')), 'C') ||
    setweight(to_tsvector('french', COALESCE(NEW.badge, '')), 'D');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Fonction search_products avec search_path
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
    (
      ts_rank_cd(p.search_vector, plainto_tsquery('french', search_query), 32) * 10 +
      CASE WHEN p.title ILIKE '%' || search_query || '%' THEN 5 ELSE 0 END +
      CASE WHEN p.description ILIKE '%' || search_query || '%' THEN 2 ELSE 0 END +
      CASE WHEN p.is_boosted = TRUE AND p.boosted_until > NOW() THEN 3 ELSE 0 END +
      CASE WHEN user_city IS NOT NULL AND p.city = user_city THEN 1 ELSE 0 END
    )::REAL as relevance_score
  FROM products p
  WHERE 
    p.is_active = TRUE
    AND p.is_sold = FALSE
    AND (
      p.search_vector @@ plainto_tsquery('french', search_query)
      OR p.title ILIKE '%' || search_query || '%'
      OR p.description ILIKE '%' || search_query || '%'
      OR p.category ILIKE '%' || search_query || '%'
      OR EXISTS (
        SELECT 1 FROM seller_shops ss
        WHERE ss.id = p.shop_id
        AND ss.shop_name ILIKE '%' || search_query || '%'
      )
    )
  ORDER BY relevance_score DESC, p.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- 3. Fonction search_suggestions avec search_path
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
$$ LANGUAGE plpgsql STABLE SET search_path = public;