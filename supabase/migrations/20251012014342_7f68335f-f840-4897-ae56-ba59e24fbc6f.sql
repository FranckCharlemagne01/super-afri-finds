-- Modifier la fonction handle_new_user pour inclure la ville (city) depuis les métadonnées utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_shop_name TEXT;
  new_shop_slug TEXT;
BEGIN
  -- Insert profile avec période d'essai de 28 jours pour les nouveaux utilisateurs
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
    NEW.raw_user_meta_data ->> 'country',
    NEW.raw_user_meta_data ->> 'city',
    now(),
    now() + interval '28 days',
    false,
    true
  );

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

  -- Si c'est un vendeur, créer automatiquement sa boutique
  IF (NEW.raw_user_meta_data ->> 'user_role' = 'seller') THEN
    -- Récupérer le nom de la boutique depuis les métadonnées ou utiliser "Djassa Boutique" par défaut
    new_shop_name := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'shop_name'), ''),
      'Djassa Boutique'
    );
    
    -- Générer un slug unique
    new_shop_slug := public.generate_shop_slug(new_shop_name);
    
    -- Créer la boutique
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
    );

    -- Initialiser le solde de jetons avec 50 jetons gratuits
    INSERT INTO public.seller_tokens (
      seller_id, 
      token_balance, 
      free_tokens_count, 
      free_tokens_expires_at,
      paid_tokens_count
    )
    VALUES (
      NEW.id, 
      50, 
      50, 
      now() + INTERVAL '28 days',
      0
    );

    -- Enregistrer la transaction de bonus d'inscription
    INSERT INTO public.token_transactions (
      seller_id,
      transaction_type,
      tokens_amount,
      status
    ) VALUES (
      NEW.id,
      'trial_bonus',
      50,
      'completed'
    );
  END IF;

  RETURN NEW;
END;
$function$;