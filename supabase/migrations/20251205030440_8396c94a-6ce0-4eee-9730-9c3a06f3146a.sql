-- Drop existing insert policy that requires tokens
DROP POLICY IF EXISTS "Sellers can insert products with tokens" ON public.products;

-- Create new insert policy that allows during trial or subscription
CREATE POLICY "Sellers can insert products during trial or subscription"
ON public.products FOR INSERT
WITH CHECK (
  auth.uid() = seller_id 
  AND (
    -- Allow if in trial
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.trial_used = false 
      AND p.trial_end_date > now()
    )
    OR
    -- Allow if has active subscription  
    EXISTS (
      SELECT 1 FROM subscriptions s 
      WHERE s.user_id = auth.uid() 
      AND s.status = 'active' 
      AND s.subscription_end > now()
    )
  )
);