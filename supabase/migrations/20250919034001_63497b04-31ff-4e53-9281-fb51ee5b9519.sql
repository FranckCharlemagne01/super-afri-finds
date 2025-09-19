-- Activer la réplication complète pour les notifications temps réel
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.cart_items REPLICA IDENTITY FULL;
ALTER TABLE public.favorites REPLICA IDENTITY FULL;

-- Ajouter les tables à la publication pour le temps réel
ALTER publication supabase_realtime ADD TABLE public.orders;
ALTER publication supabase_realtime ADD TABLE public.messages;
ALTER publication supabase_realtime ADD TABLE public.cart_items;
ALTER publication supabase_realtime ADD TABLE public.favorites;