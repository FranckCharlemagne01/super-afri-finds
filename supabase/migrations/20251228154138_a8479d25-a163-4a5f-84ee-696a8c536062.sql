-- =====================================================
-- RELANCE ESSAI GRATUIT - Tous les vendeurs = 100 jetons + 28 jours
-- =====================================================

-- 1. Réinitialiser les jetons de tous les vendeurs existants
-- Pour chaque vendeur: minimum 100 jetons gratuits + période d'essai 28 jours
UPDATE public.seller_tokens st
SET 
  free_tokens_count = GREATEST(100, COALESCE(free_tokens_count, 0)),
  token_balance = GREATEST(100, COALESCE(token_balance, 0)) + CASE 
    WHEN free_tokens_count < 100 THEN (100 - COALESCE(free_tokens_count, 0))
    ELSE 0 
  END,
  free_tokens_expires_at = now() + INTERVAL '28 days',
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = st.seller_id AND ur.role = 'seller'
);

-- 2. Réinitialiser la période d'essai dans les profils pour tous les vendeurs
UPDATE public.profiles p
SET 
  trial_start_date = now(),
  trial_end_date = now() + INTERVAL '28 days',
  trial_used = false,
  trial_bonus_tokens_given = true,
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = p.user_id AND ur.role = 'seller'
);

-- 3. S'assurer que tous les vendeurs ont une entrée dans seller_tokens
-- (au cas où certains n'en ont pas)
INSERT INTO public.seller_tokens (seller_id, token_balance, free_tokens_count, paid_tokens_count, free_tokens_expires_at)
SELECT 
  ur.user_id,
  100,
  100,
  0,
  now() + INTERVAL '28 days'
FROM public.user_roles ur
LEFT JOIN public.seller_tokens st ON st.seller_id = ur.user_id
WHERE ur.role = 'seller' AND st.id IS NULL;

-- 4. Enregistrer les transactions de bonus relance pour tous les vendeurs
INSERT INTO public.token_transactions (seller_id, transaction_type, tokens_amount, status)
SELECT 
  ur.user_id,
  'trial_bonus',
  100,
  'completed'
FROM public.user_roles ur
WHERE ur.role = 'seller'
ON CONFLICT DO NOTHING;