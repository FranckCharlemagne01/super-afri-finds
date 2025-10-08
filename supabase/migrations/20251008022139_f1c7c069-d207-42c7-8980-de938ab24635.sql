-- Modifier la fonction handle_new_user pour créer automatiquement une boutique lors de l'inscription vendeur
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

-- Modifier la fonction upgrade_to_seller pour créer aussi une boutique
CREATE OR REPLACE FUNCTION public.upgrade_to_seller(_first_name text, _last_name text, _phone text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _user_id uuid;
  _full_name text;
  new_shop_name TEXT;
  new_shop_slug TEXT;
BEGIN
  -- Récupérer l'ID utilisateur connecté
  SELECT auth.uid() INTO _user_id;
  
  IF _user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur non connecté'
    );
  END IF;
  
  -- Construire le nom complet
  _full_name := trim(_first_name || ' ' || _last_name);
  
  -- Mettre à jour le profil avec les nouvelles informations
  UPDATE profiles 
  SET 
    full_name = _full_name,
    phone = _phone,
    updated_at = now()
  WHERE user_id = _user_id;
  
  -- Ajouter le rôle vendeur (avec gestion des doublons)
  INSERT INTO user_roles (user_id, role)
  VALUES (_user_id, 'seller')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Créer automatiquement une boutique pour le nouveau vendeur
  IF NOT EXISTS (
    SELECT 1 FROM public.seller_shops 
    WHERE seller_id = _user_id AND is_active = true
  ) THEN
    -- Nom de boutique basé sur le nom complet ou "Djassa Boutique" par défaut
    IF _full_name IS NOT NULL AND trim(_full_name) != '' THEN
      new_shop_name := 'Boutique ' || _full_name;
    ELSE
      new_shop_name := 'Djassa Boutique';
    END IF;
    
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
      _user_id,
      new_shop_name,
      new_shop_slug,
      'Bienvenue sur ma boutique ! Découvrez mes produits de qualité.',
      true,
      true
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Profil vendeur activé avec succès'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;