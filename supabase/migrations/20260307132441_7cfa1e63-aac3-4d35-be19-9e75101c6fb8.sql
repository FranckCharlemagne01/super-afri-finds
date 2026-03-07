-- 1. Repair orphan seller 5c671eff who has seller role but no shop
INSERT INTO public.seller_shops (seller_id, shop_name, shop_slug, is_active, subscription_active)
VALUES (
  '5c671eff-4c26-40a6-9710-a85c30492558',
  'Boutique Franck Boza',
  'boutique-franck-boza-' || substr(gen_random_uuid()::text, 1, 6),
  true,
  false
)
ON CONFLICT (seller_id) DO NOTHING;

-- 2. Ensure token balance exists
INSERT INTO public.seller_tokens (seller_id, token_balance, free_tokens_count, free_tokens_expires_at)
VALUES (
  '5c671eff-4c26-40a6-9710-a85c30492558',
  50,
  50,
  now() + interval '28 days'
)
ON CONFLICT (seller_id) DO NOTHING;

-- 3. Create a robust function to auto-create missing shop for any seller
CREATE OR REPLACE FUNCTION public.ensure_seller_shop(_user_id uuid, _shop_name text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing_shop seller_shops%ROWTYPE;
  _new_shop_name text;
  _new_slug text;
  _profile profiles%ROWTYPE;
BEGIN
  -- Check if shop already exists
  SELECT * INTO _existing_shop FROM seller_shops WHERE seller_id = _user_id LIMIT 1;
  
  IF _existing_shop.id IS NOT NULL THEN
    RETURN json_build_object('success', true, 'shop_id', _existing_shop.id, 'already_existed', true);
  END IF;
  
  -- Verify user has seller role
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = 'seller') THEN
    RETURN json_build_object('success', false, 'error', 'User does not have seller role');
  END IF;
  
  -- Get profile for name fallback
  SELECT * INTO _profile FROM profiles WHERE user_id = _user_id;
  
  -- Determine shop name
  _new_shop_name := COALESCE(
    NULLIF(TRIM(_shop_name), ''),
    'Boutique ' || COALESCE(_profile.full_name, 'Vendeur')
  );
  
  _new_slug := generate_shop_slug(_new_shop_name);
  
  -- Create shop
  INSERT INTO seller_shops (seller_id, shop_name, shop_slug, is_active, subscription_active)
  VALUES (_user_id, _new_shop_name, _new_slug, true, false)
  ON CONFLICT (seller_id) DO NOTHING
  RETURNING * INTO _existing_shop;
  
  -- Create token balance if missing
  INSERT INTO seller_tokens (seller_id, token_balance, free_tokens_count, free_tokens_expires_at)
  VALUES (_user_id, 50, 50, now() + interval '28 days')
  ON CONFLICT (seller_id) DO NOTHING;
  
  RETURN json_build_object('success', true, 'shop_id', _existing_shop.id, 'already_existed', false);
END;
$$;