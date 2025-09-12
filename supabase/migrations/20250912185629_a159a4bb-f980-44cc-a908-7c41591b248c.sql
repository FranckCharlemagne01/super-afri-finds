-- Mettre à jour la période d'essai à 28 jours pour tous les vendeurs
-- Pour les nouveaux utilisateurs, la valeur par défaut sera 28 jours
ALTER TABLE public.profiles 
ALTER COLUMN trial_end_date SET DEFAULT (now() + interval '28 days');

-- Mettre à jour tous les vendeurs existants qui n'ont pas encore utilisé leur période d'essai
-- ou qui n'ont pas de période d'essai définie
UPDATE public.profiles 
SET 
  trial_start_date = COALESCE(trial_start_date, now()),
  trial_end_date = COALESCE(trial_start_date, now()) + interval '28 days',
  trial_used = false
WHERE user_id IN (
  SELECT ur.user_id 
  FROM user_roles ur 
  WHERE ur.role = 'seller'
)
AND (
  trial_end_date IS NULL 
  OR trial_used = true 
  OR trial_end_date < now()
);

-- Mettre à jour la fonction handle_new_user pour utiliser 28 jours
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    trial_used
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.phone, NEW.raw_user_meta_data ->> 'phone'),
    NEW.raw_user_meta_data ->> 'country',
    now(),
    now() + interval '28 days',
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