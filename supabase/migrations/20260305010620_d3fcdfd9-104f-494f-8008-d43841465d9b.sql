
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_shop_name TEXT;
  new_shop_slug TEXT;
BEGIN
  -- Insert profile with 28-day trial for new users
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    phone,
    country,
    city,
    trial_start_date,
    trial_end_date,
    trial_used,
    trial_bonus_tokens_given
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
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    country = COALESCE(EXCLUDED.country, profiles.country),
    updated_at = now();

  -- Insert user role based on signup data, default to buyer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'user_role' = 'seller' THEN 'seller'::user_role
      ELSE 'buyer'::user_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If seller, create shop and give tokens
  IF (NEW.raw_user_meta_data ->> 'user_role' = 'seller') THEN
    new_shop_name := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'shop_name'), ''),
      'Djassa Boutique'
    );
    
    new_shop_slug := public.generate_shop_slug(new_shop_name);
    
    -- Create shop if not exists
    INSERT INTO public.seller_shops (
      seller_id,
      shop_name,
      shop_slug,
      shop_description,
      is_active,
      subscription_active
    ) VALUES (
      NEW.id,
      new_shop_name,
      new_shop_slug,
      'Bienvenue sur ma boutique ! Découvrez mes produits de qualité.',
      true,
      true
    )
    ON CONFLICT DO NOTHING;

    -- Initialize token balance with 100 free tokens
    INSERT INTO public.seller_tokens (
      seller_id, 
      token_balance, 
      free_tokens_count, 
      free_tokens_expires_at,
      paid_tokens_count
    )
    VALUES (
      NEW.id, 
      100,
      100,
      now() + INTERVAL '28 days',
      0
    )
    ON CONFLICT (seller_id) DO NOTHING;

    -- Record signup bonus transaction
    INSERT INTO public.token_transactions (
      seller_id,
      transaction_type,
      tokens_amount,
      status
    ) VALUES (
      NEW.id,
      'trial_bonus',
      100,
      'completed'
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'handle_new_user error for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Also fix the 3 orphaned users by creating their profiles
INSERT INTO public.profiles (user_id, email, trial_start_date, trial_end_date, trial_used, trial_bonus_tokens_given)
SELECT au.id, au.email, now(), now() + interval '28 days', false, false
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Create missing user_roles for orphaned users
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'buyer'::user_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;
