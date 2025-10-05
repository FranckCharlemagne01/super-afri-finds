-- Modifier le trigger pour attribuer 20 jetons dès l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    true  -- Marquer comme déjà donné pour éviter les doublons
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

  -- Initialiser le solde de jetons avec 20 jetons gratuits pour les vendeurs
  IF (NEW.raw_user_meta_data ->> 'user_role' = 'seller') THEN
    INSERT INTO public.seller_tokens (seller_id, token_balance)
    VALUES (NEW.id, 20);

    -- Enregistrer la transaction de bonus d'inscription
    INSERT INTO public.token_transactions (
      seller_id,
      transaction_type,
      tokens_amount,
      status
    ) VALUES (
      NEW.id,
      'trial_bonus',
      20,
      'completed'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();