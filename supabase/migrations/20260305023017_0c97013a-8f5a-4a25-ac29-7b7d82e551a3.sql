
-- ============================================================
-- FIX 1: Rewrite handle_new_user with separate exception blocks
-- so seller logic errors don't roll back profile + role creation
-- ============================================================
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
  -- =====================================================
  -- STEP 1: Create profile (MUST NOT FAIL)
  -- =====================================================
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

  -- =====================================================
  -- STEP 2: Assign role (MUST NOT FAIL)
  -- =====================================================
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

  -- =====================================================
  -- STEP 3: Seller-specific setup (isolated, errors logged but don't block signup)
  -- =====================================================
  IF _signup_role = 'seller' THEN
    BEGIN
      new_shop_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'shop_name'), ''),
        'Djassa Boutique'
      );

      new_shop_slug := public.generate_shop_slug(new_shop_name);

      INSERT INTO public.seller_shops (
        seller_id, shop_name, shop_slug, shop_description, is_active, subscription_active
      ) VALUES (
        NEW.id, new_shop_name, new_shop_slug,
        'Bienvenue sur ma boutique ! Découvrez mes produits de qualité.',
        true, true
      )
      ON CONFLICT DO NOTHING;

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

      -- Mark trial bonus as given
      UPDATE public.profiles 
      SET trial_bonus_tokens_given = true 
      WHERE user_id = NEW.id;

    EXCEPTION WHEN OTHERS THEN
      -- Log seller setup error but profile + role are already committed
      RAISE WARNING '[handle_new_user] Seller setup error for user %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- FIX 2: Repair orphaned users (sellers who got no profile/role/shop)
-- ============================================================

-- Fix nidit92431@cslua.com
INSERT INTO public.profiles (user_id, email, full_name, phone, country, city, trial_start_date, trial_end_date, trial_used, trial_bonus_tokens_given)
VALUES ('cadd02d3-aee7-4478-82f5-603442a27a29', 'nidit92431@cslua.com', 'Boza charlemagne', '+2250788281222', 'CI', 'Abidjan', now(), now() + interval '28 days', false, true)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('cadd02d3-aee7-4478-82f5-603442a27a29', 'seller'::user_role)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.seller_shops (seller_id, shop_name, shop_slug, shop_description, is_active, subscription_active)
VALUES ('cadd02d3-aee7-4478-82f5-603442a27a29', 'Zara boutique', public.generate_shop_slug('Zara boutique'), 'Bienvenue sur ma boutique !', true, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.seller_tokens (seller_id, token_balance, free_tokens_count, free_tokens_expires_at, paid_tokens_count)
VALUES ('cadd02d3-aee7-4478-82f5-603442a27a29', 100, 100, now() + interval '28 days', 0)
ON CONFLICT (seller_id) DO NOTHING;

-- Fix franck@gmail.com
INSERT INTO public.profiles (user_id, email, full_name, phone, country, city, trial_start_date, trial_end_date, trial_used, trial_bonus_tokens_given)
VALUES ('77b3de34-e828-4c50-ae7c-e02f1ae7998f', 'franck@gmail.com', 'Boza charlemagne', '+2250788281222', 'CI', 'Abidjan', now(), now() + interval '28 days', false, true)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('77b3de34-e828-4c50-ae7c-e02f1ae7998f', 'seller'::user_role)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.seller_shops (seller_id, shop_name, shop_slug, shop_description, is_active, subscription_active)
VALUES ('77b3de34-e828-4c50-ae7c-e02f1ae7998f', 'Nysafric', public.generate_shop_slug('Nysafric'), 'Bienvenue sur ma boutique !', true, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.seller_tokens (seller_id, token_balance, free_tokens_count, free_tokens_expires_at, paid_tokens_count)
VALUES ('77b3de34-e828-4c50-ae7c-e02f1ae7998f', 100, 100, now() + interval '28 days', 0)
ON CONFLICT (seller_id) DO NOTHING;
