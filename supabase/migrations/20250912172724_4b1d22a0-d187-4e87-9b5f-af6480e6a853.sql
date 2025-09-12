-- Supprimer l'ancienne politique qui nécessitait le statut premium
DROP POLICY IF EXISTS "Premium sellers can insert their own products" ON products;

-- Créer une nouvelle politique permettant à tous les vendeurs authentifiés de publier
CREATE POLICY "Sellers can insert their own products"
ON products
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Mettre à jour la politique de sélection pour que tous puissent voir les produits actifs  
-- sans restriction de premium
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Superadmins can view all products" ON products;

-- Recréer les politiques de visualisation
CREATE POLICY "Products are viewable by everyone"
ON products
FOR SELECT
USING (is_active = true);

CREATE POLICY "Superadmins can view all products"
ON products  
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::user_role));