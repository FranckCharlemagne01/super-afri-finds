
-- Fix consume_bonus_publication
CREATE OR REPLACE FUNCTION public.consume_bonus_publication(p_seller_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bonus_id uuid;
  _remaining integer;
BEGIN
  SELECT b.id, (b.max_products - b.used_products)
  INTO _bonus_id, _remaining
  FROM publication_bonus b
  WHERE b.seller_id = p_seller_id
    AND b.is_active = true
    AND b.expires_at > now()
    AND b.starts_at <= now()
    AND b.used_products < b.max_products
  ORDER BY b.expires_at ASC
  LIMIT 1;

  IF _bonus_id IS NULL THEN
    RETURN jsonb_build_object('has_bonus', false);
  END IF;

  UPDATE publication_bonus SET used_products = used_products + 1 WHERE id = _bonus_id;

  UPDATE products SET bonus_id = _bonus_id
  WHERE id = (
    SELECT id FROM products 
    WHERE seller_id = p_seller_id AND bonus_id IS NULL 
    ORDER BY created_at DESC LIMIT 1
  );

  RETURN jsonb_build_object('has_bonus', true, 'bonus_id', _bonus_id, 'products_remaining', _remaining - 1);
END;
$$;

-- Fix toggle_publication_bonus
CREATE OR REPLACE FUNCTION public.toggle_publication_bonus(p_bonus_id uuid, p_active boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE publication_bonus 
  SET is_active = p_active 
  WHERE id = p_bonus_id AND seller_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bonus non trouvé');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Fix admin_create_publication_bonus
CREATE OR REPLACE FUNCTION public.admin_create_publication_bonus(
  p_seller_id uuid,
  p_starts_at timestamptz,
  p_expires_at timestamptz,
  p_max_products integer,
  p_reason text DEFAULT 'Bonus admin'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_id uuid;
BEGIN
  INSERT INTO publication_bonus (seller_id, starts_at, expires_at, max_products, bonus_type, is_active)
  VALUES (p_seller_id, p_starts_at, p_expires_at, p_max_products, 'admin', true)
  RETURNING id INTO _new_id;

  RETURN jsonb_build_object('success', true, 'bonus_id', _new_id, 'max_products', p_max_products);
END;
$$;

-- Create/replace trigger for new seller trial bonus
CREATE OR REPLACE FUNCTION public.create_trial_bonus_for_new_seller()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'seller' THEN
    INSERT INTO publication_bonus (seller_id, starts_at, expires_at, max_products, bonus_type, is_active)
    VALUES (NEW.user_id, now(), now() + interval '7 days', 10, 'trial', true)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_trial_bonus ON profiles;
CREATE TRIGGER trg_create_trial_bonus
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_trial_bonus_for_new_seller();
