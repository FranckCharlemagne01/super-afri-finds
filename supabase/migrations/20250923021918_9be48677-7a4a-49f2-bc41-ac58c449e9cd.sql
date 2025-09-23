-- Créer une fonction sécurisée pour permettre l'upgrade vers vendeur
CREATE OR REPLACE FUNCTION public.upgrade_to_seller(
  _first_name text,
  _last_name text,
  _phone text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _full_name text;
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