-- Fonction pour créer des boutiques pour tous les vendeurs existants qui n'en ont pas
CREATE OR REPLACE FUNCTION public.create_shops_for_existing_sellers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_record RECORD;
  new_shop_name TEXT;
  new_shop_slug TEXT;
BEGIN
  -- Pour chaque vendeur qui n'a pas encore de boutique
  FOR seller_record IN 
    SELECT DISTINCT ur.user_id, p.full_name, p.email
    FROM user_roles ur
    LEFT JOIN profiles p ON p.user_id = ur.user_id
    LEFT JOIN seller_shops ss ON ss.seller_id = ur.user_id AND ss.is_active = true
    WHERE ur.role = 'seller' 
      AND ss.id IS NULL
  LOOP
    -- Créer un nom de boutique basé sur le nom du vendeur
    IF seller_record.full_name IS NOT NULL AND trim(seller_record.full_name) != '' THEN
      new_shop_name := 'Boutique ' || seller_record.full_name;
    ELSE
      new_shop_name := 'Ma Boutique';
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
      seller_record.user_id,
      new_shop_name,
      new_shop_slug,
      'Bienvenue sur ma boutique ! Découvrez mes produits.',
      true,
      true
    );
    
    -- Mettre à jour les produits existants du vendeur pour les lier à la boutique
    UPDATE public.products
    SET shop_id = (
      SELECT id FROM public.seller_shops 
      WHERE seller_id = seller_record.user_id AND is_active = true
      LIMIT 1
    )
    WHERE seller_id = seller_record.user_id 
      AND shop_id IS NULL;
  END LOOP;
END;
$$;

-- Exécuter la fonction pour créer les boutiques
SELECT public.create_shops_for_existing_sellers();