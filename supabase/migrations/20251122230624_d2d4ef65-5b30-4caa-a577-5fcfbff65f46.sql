-- Supprimer les anciennes politiques restrictives problématiques
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Superadmins can view all products" ON products;

-- Créer une politique PERMISSIVE pour que TOUS les visiteurs (connectés ou non) 
-- puissent voir les produits actifs
CREATE POLICY "Public can view active products"
ON products
FOR SELECT
TO public
USING (is_active = true);

-- Politique séparée pour que les superadmins voient TOUS les produits (actifs ou non)
CREATE POLICY "Superadmins can view all products"
ON products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'superadmin'
  )
);