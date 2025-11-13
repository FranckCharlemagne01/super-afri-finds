-- Configurer REPLICA IDENTITY FULL pour la table orders
-- Cela permet de capturer toutes les colonnes lors des changements en temps réel
ALTER TABLE public.orders REPLICA IDENTITY FULL;