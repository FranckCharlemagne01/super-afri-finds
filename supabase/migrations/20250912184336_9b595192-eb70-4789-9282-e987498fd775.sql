-- Ajouter les colonnes pour la période d'essai gratuite
ALTER TABLE profiles 
ADD COLUMN trial_start_date timestamp with time zone DEFAULT now(),
ADD COLUMN trial_end_date timestamp with time zone DEFAULT (now() + interval '14 days'),
ADD COLUMN trial_used boolean DEFAULT false;

-- Mettre à jour les profils existants pour qu'ils aient déjà utilisé leur essai
UPDATE profiles 
SET trial_used = true, 
    trial_start_date = created_at,
    trial_end_date = created_at
WHERE created_at < now();

-- Fonction pour vérifier si un utilisateur est en période d'essai
CREATE OR REPLACE FUNCTION public.is_in_trial_period(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN p.trial_used = false AND p.trial_end_date > now() THEN true
    ELSE false
  END
  FROM profiles p
  WHERE p.user_id = _user_id;
$$;

-- Fonction pour vérifier si un utilisateur peut publier (essai ou premium)
CREATE OR REPLACE FUNCTION public.can_publish_products(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN p.is_premium = true AND p.premium_expires_at > now() THEN true
    WHEN p.trial_used = false AND p.trial_end_date > now() THEN true
    ELSE false
  END
  FROM profiles p
  WHERE p.user_id = _user_id;
$$;

-- Mettre à jour la politique d'insertion des produits
DROP POLICY IF EXISTS "Sellers can insert their own products" ON products;

CREATE POLICY "Sellers can insert products during trial or premium"
ON products
FOR INSERT
WITH CHECK (
  auth.uid() = seller_id 
  AND can_publish_products(auth.uid())
);

-- Mettre à jour le trigger pour gérer la période d'essai des nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile avec période d'essai pour les nouveaux utilisateurs
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    phone,
    country,
    trial_start_date,
    trial_end_date,
    trial_used
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.phone, NEW.raw_user_meta_data ->> 'phone'),
    NEW.raw_user_meta_data ->> 'country',
    now(),
    now() + interval '14 days',
    false
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

  RETURN NEW;
END;
$$;