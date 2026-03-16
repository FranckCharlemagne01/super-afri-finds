-- Recreate consume_bonus_publication to return bonus_id
DROP FUNCTION IF EXISTS public.consume_bonus_publication(uuid);

CREATE OR REPLACE FUNCTION public.consume_bonus_publication(p_seller_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bonus_id uuid;
  _remaining int;
BEGIN
  SELECT id INTO _bonus_id
  FROM publication_bonus
  WHERE seller_id = p_seller_id
    AND is_active = true
    AND starts_at <= now()
    AND expires_at > now()
    AND used_products < max_products
  ORDER BY created_at ASC
  LIMIT 1;

  IF _bonus_id IS NULL THEN
    RETURN json_build_object('has_bonus', false, 'bonus_id', null, 'products_remaining', 0);
  END IF;

  UPDATE publication_bonus
  SET used_products = used_products + 1
  WHERE id = _bonus_id;

  SELECT (max_products - used_products) INTO _remaining
  FROM publication_bonus
  WHERE id = _bonus_id;

  RETURN json_build_object('has_bonus', true, 'bonus_id', _bonus_id, 'products_remaining', _remaining);
END;
$$;