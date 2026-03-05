
-- ============================================================
-- MIGRATION: Security hardening & performance indexes
-- ============================================================

-- 1. DROP REDUNDANT TRIGGER (handle_new_user_role duplicates handle_new_user)
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role();

-- 2. ADD MISSING PERFORMANCE INDEXES ON FK COLUMNS
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages (recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_product_id ON public.messages (product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders (seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products (seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_is_boosted ON public.products (is_boosted, boosted_until) WHERE is_boosted = true;

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);

CREATE INDEX IF NOT EXISTS idx_token_transactions_seller_id ON public.token_transactions (seller_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites (product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items (product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications (user_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_premium_payments_user_id ON public.premium_payments (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_visit_date ON public.site_visits (visit_date DESC);
