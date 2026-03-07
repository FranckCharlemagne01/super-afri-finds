
-- Repair existing shops where shop_name was set to fallback instead of user's chosen name
UPDATE public.seller_shops ss
SET shop_name = TRIM(u.raw_user_meta_data->>'shop_name'),
    shop_slug = public.generate_shop_slug(TRIM(u.raw_user_meta_data->>'shop_name')),
    updated_at = now()
FROM auth.users u
WHERE u.id = ss.seller_id
  AND u.raw_user_meta_data->>'shop_name' IS NOT NULL
  AND TRIM(u.raw_user_meta_data->>'shop_name') != ''
  AND ss.shop_name != TRIM(u.raw_user_meta_data->>'shop_name')
  AND ss.shop_name LIKE 'Boutique %';
