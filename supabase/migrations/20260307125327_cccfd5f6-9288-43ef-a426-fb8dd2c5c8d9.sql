
-- 1. Clean up duplicate shops (keep oldest per seller)
DELETE FROM public.seller_shops
WHERE id NOT IN (
  SELECT DISTINCT ON (seller_id) id
  FROM public.seller_shops
  ORDER BY seller_id, created_at ASC
);

-- 2. Add UNIQUE constraint on seller_id (one shop per seller)
ALTER TABLE public.seller_shops
  ADD CONSTRAINT seller_shops_seller_id_key UNIQUE (seller_id);

-- 3. Repair orphaned sellers (have role but no shop)
DO $$
DECLARE
  r RECORD;
  _slug TEXT;
  _shop_name TEXT;
BEGIN
  FOR r IN
    SELECT ur.user_id, p.full_name
    FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    LEFT JOIN public.seller_shops ss ON ss.seller_id = ur.user_id
    WHERE ur.role = 'seller' AND ss.id IS NULL
  LOOP
    _shop_name := 'Boutique ' || COALESCE(NULLIF(TRIM(r.full_name), ''), 'Djassa');
    _slug := public.generate_shop_slug(_shop_name);
    
    INSERT INTO public.seller_shops (
      seller_id, shop_name, shop_slug, shop_description, is_active, subscription_active
    ) VALUES (
      r.user_id, _shop_name, _slug,
      'Bienvenue sur ma boutique !',
      true, true
    )
    ON CONFLICT (seller_id) DO NOTHING;
    
    INSERT INTO public.seller_tokens (
      seller_id, token_balance, free_tokens_count, free_tokens_expires_at, paid_tokens_count
    ) VALUES (
      r.user_id, 100, 100, now() + INTERVAL '28 days', 0
    )
    ON CONFLICT (seller_id) DO NOTHING;
  END LOOP;
END $$;

-- 4. Fix trigger to use ON CONFLICT (seller_id)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_shop_name TEXT;
  new_shop_slug TEXT;
  _signup_role TEXT;
BEGIN
  INSERT INTO public.profiles (
    user_id, email, full_name, phone, country, city,
    trial_start_date, trial_end_date, trial_used, trial_bonus_tokens_given
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.phone, NEW.raw_user_meta_data ->> 'phone'),
    COALESCE(NEW.raw_user_meta_data ->> 'country', 'CI'),
    COALESCE(NEW.raw_user_meta_data ->> 'city', 'Abidjan'),
    now(),
    now() + interval '28 days',
    false,
    false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    country = COALESCE(EXCLUDED.country, profiles.country),
    updated_at = now();

  _signup_role := COALESCE(NEW.raw_user_meta_data ->> 'user_role', 'buyer');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN _signup_role = 'seller' THEN 'seller'::user_role
      ELSE 'buyer'::user_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _signup_role = 'seller' THEN
    BEGIN
      new_shop_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'shop_name'), ''),
        'Boutique ' || COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''), 'Djassa')
      );

      new_shop_slug := public.generate_shop_slug(new_shop_name);

      INSERT INTO public.seller_shops (
        seller_id, shop_name, shop_slug, shop_description, is_active, subscription_active
      ) VALUES (
        NEW.id, new_shop_name, new_shop_slug,
        'Bienvenue sur ma boutique ! Découvrez mes produits de qualité.',
        true, true
      )
      ON CONFLICT (seller_id) DO UPDATE SET
        shop_name = CASE 
          WHEN seller_shops.shop_name LIKE 'Boutique %' OR seller_shops.shop_name = 'Djassa Boutique'
          THEN EXCLUDED.shop_name
          ELSE seller_shops.shop_name
        END,
        updated_at = now();

      INSERT INTO public.seller_tokens (
        seller_id, token_balance, free_tokens_count, free_tokens_expires_at, paid_tokens_count
      ) VALUES (
        NEW.id, 100, 100, now() + INTERVAL '28 days', 0
      )
      ON CONFLICT (seller_id) DO NOTHING;

      INSERT INTO public.token_transactions (
        seller_id, transaction_type, tokens_amount, status
      ) VALUES (
        NEW.id, 'trial_bonus', 100, 'completed'
      );

      UPDATE public.profiles 
      SET trial_bonus_tokens_given = true 
      WHERE user_id = NEW.id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[handle_new_user] Seller setup error for user %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;
