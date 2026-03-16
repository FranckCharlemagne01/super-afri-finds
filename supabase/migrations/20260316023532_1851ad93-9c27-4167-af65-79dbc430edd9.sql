-- Drop and recreate admin_create_publication_bonus with correct return type
DROP FUNCTION IF EXISTS public.admin_create_publication_bonus(uuid, timestamptz, timestamptz, integer, text);

CREATE FUNCTION public.admin_create_publication_bonus(
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
  INSERT INTO publication_bonus (seller_id, starts_at, expires_at, max_products, used_products, bonus_type, is_active)
  VALUES (p_seller_id, p_starts_at, p_expires_at, p_max_products, 0, 'admin', true)
  RETURNING id INTO _new_id;

  RETURN jsonb_build_object('success', true, 'bonus_id', _new_id, 'max_products', p_max_products);
END;
$$;