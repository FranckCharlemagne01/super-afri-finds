-- Ajouter le champ push_token à la table profiles pour stocker les tokens de notification push
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Créer un index pour améliorer les performances lors de la recherche par push_token
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON public.profiles(push_token);

-- Commenter la colonne
COMMENT ON COLUMN public.profiles.push_token IS 'Token de notification push pour l''application mobile (FCM pour Android, APNs pour iOS)';
