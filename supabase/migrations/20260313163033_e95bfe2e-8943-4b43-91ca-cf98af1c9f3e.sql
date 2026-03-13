
-- Drop existing functions to allow return type changes
DROP FUNCTION IF EXISTS search_products(text, text, text);
DROP FUNCTION IF EXISTS search_suggestions(text, integer);

-- Update search_vector trigger to include city and commune
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(NEW.category, '')), 'C') ||
    setweight(to_tsvector('french', coalesce(NEW.city, '')), 'D') ||
    setweight(to_tsvector('french', coalesce(NEW.commune, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing products search vectors
UPDATE products SET updated_at = now() WHERE is_active = true;

-- Recreate search_products with city/commune support
CREATE OR REPLACE FUNCTION search_products(
  search_query text,
  user_city text DEFAULT NULL,
  user_country text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  price numeric,
  category text,
  images text[],
  seller_id uuid,
  original_price numeric,
  discount_percentage integer,
  rating numeric,
  reviews_count integer,
  is_flash_sale boolean,
  badge text,
  video_url text,
  city text,
  country text,
  commune text,
  relevance_score real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.title, p.description, p.price, p.category, p.images, p.seller_id,
    p.original_price, p.discount_percentage, p.rating, p.reviews_count,
    p.is_flash_sale, p.badge, p.video_url, p.city, p.country, p.commune,
    (
      ts_rank_cd(p.search_vector, plainto_tsquery('french', search_query)) * 10
      + CASE WHEN p.title ILIKE '%' || search_query || '%' THEN 5.0 ELSE 0.0 END
      + CASE WHEN p.description ILIKE '%' || search_query || '%' THEN 2.0 ELSE 0.0 END
      + CASE WHEN p.category ILIKE '%' || search_query || '%' THEN 3.0 ELSE 0.0 END
      + CASE WHEN p.city ILIKE '%' || search_query || '%' THEN 4.0 ELSE 0.0 END
      + CASE WHEN p.commune ILIKE '%' || search_query || '%' THEN 4.0 ELSE 0.0 END
      + CASE WHEN p.is_boosted = true AND p.boosted_until > now() THEN 3.0 ELSE 0.0 END
      + CASE WHEN user_city IS NOT NULL AND p.city ILIKE user_city THEN 2.0 ELSE 0.0 END
    )::real AS relevance_score
  FROM products p
  WHERE p.is_active = true
    AND p.images IS NOT NULL
    AND array_length(p.images, 1) > 0
    AND (
      p.search_vector @@ plainto_tsquery('french', search_query)
      OR p.title ILIKE '%' || search_query || '%'
      OR p.description ILIKE '%' || search_query || '%'
      OR p.category ILIKE '%' || search_query || '%'
      OR p.city ILIKE '%' || search_query || '%'
      OR p.commune ILIKE '%' || search_query || '%'
    )
  ORDER BY relevance_score DESC, p.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- Recreate search_suggestions with city/commune suggestions
CREATE OR REPLACE FUNCTION search_suggestions(
  search_query text,
  max_results integer DEFAULT 10
)
RETURNS TABLE(
  id text,
  title text,
  type text,
  category text
) AS $$
BEGIN
  RETURN QUERY
  (
    SELECT p.id::text, p.title, 'product'::text, p.category
    FROM products p
    WHERE p.is_active = true AND p.images IS NOT NULL AND array_length(p.images, 1) > 0
      AND (p.search_vector @@ plainto_tsquery('french', search_query) OR p.title ILIKE '%' || search_query || '%')
    ORDER BY ts_rank_cd(p.search_vector, plainto_tsquery('french', search_query)) DESC
    LIMIT max_results - 4
  )
  UNION ALL
  (
    SELECT DISTINCT p.category::text, p.category, 'category'::text, p.category
    FROM products p
    WHERE p.is_active = true AND p.category ILIKE '%' || search_query || '%'
    LIMIT 2
  )
  UNION ALL
  (
    SELECT DISTINCT ('city:' || p.city)::text, ('Produits à ' || p.city), 'city'::text, NULL::text
    FROM products p
    WHERE p.is_active = true AND p.city IS NOT NULL AND p.city ILIKE '%' || search_query || '%'
    LIMIT 2
  )
  UNION ALL
  (
    SELECT DISTINCT ('commune:' || p.commune)::text, ('Produits à ' || p.commune), 'commune'::text, NULL::text
    FROM products p
    WHERE p.is_active = true AND p.commune IS NOT NULL AND p.commune ILIKE '%' || search_query || '%'
    LIMIT 2
  )
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;
