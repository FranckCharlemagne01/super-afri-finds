-- Fonction pour créer automatiquement une boutique lors de la première publication
CREATE OR REPLACE FUNCTION public.auto_create_seller_shop()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_profile RECORD;
  new_shop_name TEXT;
  new_shop_slug TEXT;
BEGIN
  -- Vérifier si le vendeur a déjà une boutique
  IF NOT EXISTS (
    SELECT 1 FROM public.seller_shops 
    WHERE seller_id = NEW.seller_id AND is_active = true
  ) THEN
    -- Récupérer les informations du profil du vendeur
    SELECT full_name, email INTO seller_profile
    FROM public.profiles
    WHERE user_id = NEW.seller_id;
    
    -- Créer un nom de boutique basé sur le nom du vendeur
    IF seller_profile.full_name IS NOT NULL AND trim(seller_profile.full_name) != '' THEN
      new_shop_name := 'Boutique ' || seller_profile.full_name;
    ELSE
      new_shop_name := 'Ma Boutique';
    END IF;
    
    -- Générer un slug unique
    new_shop_slug := public.generate_shop_slug(new_shop_name);
    
    -- Créer la boutique automatiquement
    INSERT INTO public.seller_shops (
      seller_id,
      shop_name,
      shop_slug,
      shop_description,
      is_active,
      subscription_active
    ) VALUES (
      NEW.seller_id,
      new_shop_name,
      new_shop_slug,
      'Bienvenue sur ma boutique ! Découvrez mes produits.',
      true,
      true  -- Active par défaut pour les nouveaux vendeurs
    );
    
    -- Mettre à jour le produit avec le shop_id de la nouvelle boutique
    NEW.shop_id := (
      SELECT id FROM public.seller_shops 
      WHERE seller_id = NEW.seller_id AND is_active = true
      LIMIT 1
    );
  ELSE
    -- Si la boutique existe déjà, s'assurer que le produit a le bon shop_id
    IF NEW.shop_id IS NULL THEN
      NEW.shop_id := (
        SELECT id FROM public.seller_shops 
        WHERE seller_id = NEW.seller_id AND is_active = true
        LIMIT 1
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger pour la création automatique de boutique
DROP TRIGGER IF EXISTS trigger_auto_create_shop ON public.products;
CREATE TRIGGER trigger_auto_create_shop
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_seller_shop();