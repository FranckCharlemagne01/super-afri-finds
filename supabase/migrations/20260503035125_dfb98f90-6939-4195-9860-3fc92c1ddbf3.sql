
CREATE OR REPLACE FUNCTION public.can_insert_products(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_active_bonus boolean;
  has_wallet boolean;
  has_subscription boolean;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.publication_bonus
    WHERE seller_id = _user_id
      AND is_active = true
      AND now() BETWEEN starts_at AND expires_at
      AND COALESCE(used_products,0) < max_products
  ) INTO has_active_bonus;
  IF has_active_bonus THEN RETURN true; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.seller_tokens
    WHERE seller_id = _user_id AND wallet_balance_fcfa >= 200
  ) INTO has_wallet;
  IF has_wallet THEN RETURN true; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND (subscription_end IS NULL OR subscription_end > now())
  ) INTO has_subscription;
  IF has_subscription THEN RETURN true; END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND COALESCE(trial_end_date, created_at + interval '28 days') > now()
  );
END;
$$;

DROP POLICY IF EXISTS "System can insert notifications for any user" ON public.notifications;
CREATE POLICY "Users can insert their own notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only superadmins can insert roles" ON public.user_roles;
CREATE POLICY "Only superadmins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'::user_role));

DROP POLICY IF EXISTS "Only superadmins can update roles" ON public.user_roles;
CREATE POLICY "Only superadmins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'::user_role));

DROP POLICY IF EXISTS "Only superadmins can delete roles" ON public.user_roles;
CREATE POLICY "Only superadmins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'::user_role));

DROP POLICY IF EXISTS "Sellers can view their own orders" ON public.orders;
CREATE POLICY "Sellers can view their own orders"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = seller_id);

CREATE OR REPLACE FUNCTION public.search_products(search_query text, user_city text DEFAULT NULL::text, user_country text DEFAULT NULL::text)
RETURNS TABLE(id uuid, title text, description text, price numeric, category text, images text[], seller_id uuid, original_price numeric, discount_percentage integer, rating numeric, reviews_count integer, is_flash_sale boolean, badge text, video_url text, city text, country text, commune text, relevance_score real)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $function$
DECLARE
  q text;
  esc text;
BEGIN
  q := substring(coalesce(search_query, '') from 1 for 100);
  esc := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_');
  RETURN QUERY
  SELECT
    p.id, p.title, p.description, p.price, p.category, p.images, p.seller_id,
    p.original_price, p.discount_percentage, p.rating, p.reviews_count,
    p.is_flash_sale, p.badge, p.video_url, p.city, p.country, p.commune,
    (
      ts_rank_cd(p.search_vector, plainto_tsquery('french', q)) * 10
      + CASE WHEN p.title ILIKE '%' || esc || '%' ESCAPE '\' THEN 5.0 ELSE 0.0 END
      + CASE WHEN p.description ILIKE '%' || esc || '%' ESCAPE '\' THEN 2.0 ELSE 0.0 END
      + CASE WHEN p.category ILIKE '%' || esc || '%' ESCAPE '\' THEN 3.0 ELSE 0.0 END
      + CASE WHEN p.city ILIKE '%' || esc || '%' ESCAPE '\' THEN 4.0 ELSE 0.0 END
      + CASE WHEN p.commune ILIKE '%' || esc || '%' ESCAPE '\' THEN 4.0 ELSE 0.0 END
      + CASE WHEN p.is_boosted = true AND p.boosted_until > now() THEN 3.0 ELSE 0.0 END
      + CASE WHEN user_city IS NOT NULL AND p.city ILIKE user_city THEN 2.0 ELSE 0.0 END
    )::real AS relevance_score
  FROM products p
  WHERE p.is_active = true
    AND p.images IS NOT NULL
    AND array_length(p.images, 1) > 0
    AND (
      p.search_vector @@ plainto_tsquery('french', q)
      OR p.title ILIKE '%' || esc || '%' ESCAPE '\'
      OR p.description ILIKE '%' || esc || '%' ESCAPE '\'
      OR p.category ILIKE '%' || esc || '%' ESCAPE '\'
      OR p.city ILIKE '%' || esc || '%' ESCAPE '\'
      OR p.commune ILIKE '%' || esc || '%' ESCAPE '\'
    )
  ORDER BY relevance_score DESC, p.created_at DESC
  LIMIT 50;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_suggestions(search_query text, max_results integer DEFAULT 10)
RETURNS TABLE(id text, title text, type text, category text)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $function$
DECLARE
  q text;
  esc text;
BEGIN
  q := substring(coalesce(search_query, '') from 1 for 100);
  esc := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_');
  RETURN QUERY
  (
    SELECT p.id::text, p.title, 'product'::text, p.category
    FROM products p
    WHERE p.is_active = true AND p.images IS NOT NULL AND array_length(p.images, 1) > 0
      AND (p.search_vector @@ plainto_tsquery('french', q) OR p.title ILIKE '%' || esc || '%' ESCAPE '\')
    ORDER BY ts_rank_cd(p.search_vector, plainto_tsquery('french', q)) DESC
    LIMIT max_results - 4
  )
  UNION ALL
  (
    SELECT DISTINCT p.category::text, p.category, 'category'::text, p.category
    FROM products p
    WHERE p.is_active = true AND p.category ILIKE '%' || esc || '%' ESCAPE '\'
    LIMIT 2
  )
  UNION ALL
  (
    SELECT DISTINCT ('city:' || p.city)::text, ('Produits à ' || p.city), 'city'::text, NULL::text
    FROM products p
    WHERE p.is_active = true AND p.city IS NOT NULL AND p.city ILIKE '%' || esc || '%' ESCAPE '\'
    LIMIT 2
  )
  UNION ALL
  (
    SELECT DISTINCT ('commune:' || p.commune)::text, ('Produits à ' || p.commune), 'commune'::text, NULL::text
    FROM products p
    WHERE p.is_active = true AND p.commune IS NOT NULL AND p.commune ILIKE '%' || esc || '%' ESCAPE '\'
    LIMIT 2
  )
  LIMIT max_results;
END;
$function$;
