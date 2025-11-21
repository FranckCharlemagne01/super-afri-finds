-- Security: Add message content length constraint to prevent storage exhaustion and DoS
-- This addresses the "Message content has no length validation" security finding

ALTER TABLE messages 
ADD CONSTRAINT message_content_length 
CHECK (char_length(content) <= 5000);

-- Security: Add rate limiting to prevent message spam
-- Maximum 50 messages per hour per user
CREATE POLICY "Rate limit messages per user"
ON messages FOR INSERT
WITH CHECK (
  (SELECT COUNT(*) 
   FROM messages 
   WHERE sender_id = auth.uid() 
   AND created_at > now() - interval '1 hour') < 50
);

-- Security: Add explicit authentication checks to SECURITY DEFINER functions
-- This addresses the "Multiple SECURITY DEFINER functions may bypass RLS" finding

-- Update has_role function to explicitly check authentication
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- SECURITY: Explicit NULL check for authentication
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'PGRST';
  END IF;
  
  -- SECURITY: Only allow checking own role OR if caller is superadmin
  IF _user_id != current_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = current_user_id AND role = 'superadmin'
    ) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Update upgrade_to_seller to add explicit auth check
CREATE OR REPLACE FUNCTION public.upgrade_to_seller(_first_name text, _last_name text, _phone text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _user_id uuid;
  _full_name text;
  new_shop_name TEXT;
  new_shop_slug TEXT;
BEGIN
  -- SECURITY: Explicit authentication check
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Authentication required - utilisateur non connecté'
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
    IF _full_name IS NOT NULL AND trim(_full_name) != '' THEN
      new_shop_name := 'Boutique ' || _full_name;
    ELSE
      new_shop_name := 'Djassa Boutique';
    END IF;
    
    new_shop_slug := public.generate_shop_slug(new_shop_name);
    
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
$$;

-- Update assign_superadmin_role to add explicit auth check
CREATE OR REPLACE FUNCTION public.assign_superadmin_role(_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _user_id UUID;
  current_user_id UUID;
BEGIN
  -- SECURITY: Explicit authentication check
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'PGRST';
  END IF;
  
  -- SECURITY: Only superadmins can assign superadmin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = current_user_id AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only superadmins can assign superadmin role' USING ERRCODE = 'PGRST';
  END IF;
  
  -- Find user by email
  SELECT auth.users.id INTO _user_id
  FROM auth.users
  WHERE auth.users.email = _email;
  
  IF _user_id IS NULL THEN
    RETURN 'User not found with email: ' || _email;
  END IF;
  
  -- Insert or update to superadmin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'superadmin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN 'Superadmin role assigned to user: ' || _email;
END;
$$;