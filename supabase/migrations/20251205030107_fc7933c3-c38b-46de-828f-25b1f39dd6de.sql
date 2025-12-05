-- Create subscriptions table for seller subscriptions
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive', -- 'active', 'inactive', 'expired', 'cancelled'
  subscription_start TIMESTAMP WITH TIME ZONE,
  subscription_end TIMESTAMP WITH TIME ZONE,
  paystack_reference TEXT,
  amount NUMERIC DEFAULT 5000, -- Monthly fee in XOF
  currency TEXT DEFAULT 'XOF',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage all subscriptions"
ON public.subscriptions FOR ALL
USING (has_role(auth.uid(), 'superadmin'::user_role));

-- Create index for performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Function to check if seller can access seller features
CREATE OR REPLACE FUNCTION public.can_access_seller_features(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_record RECORD;
  subscription_record RECORD;
  trial_days_left INTEGER;
  is_in_trial BOOLEAN;
  has_active_subscription BOOLEAN;
BEGIN
  -- Get profile info
  SELECT trial_start_date, trial_end_date, trial_used
  INTO profile_record
  FROM profiles
  WHERE user_id = _user_id;
  
  -- Get subscription info
  SELECT status, subscription_end
  INTO subscription_record
  FROM subscriptions
  WHERE user_id = _user_id;
  
  -- Calculate trial status
  is_in_trial := (
    profile_record.trial_used = false 
    AND profile_record.trial_end_date IS NOT NULL 
    AND profile_record.trial_end_date > now()
  );
  
  -- Calculate days left in trial
  IF is_in_trial THEN
    trial_days_left := EXTRACT(DAY FROM (profile_record.trial_end_date - now()));
  ELSE
    trial_days_left := 0;
  END IF;
  
  -- Check subscription status
  has_active_subscription := (
    subscription_record.status = 'active' 
    AND subscription_record.subscription_end IS NOT NULL 
    AND subscription_record.subscription_end > now()
  );
  
  RETURN jsonb_build_object(
    'can_access', (is_in_trial OR has_active_subscription),
    'is_in_trial', is_in_trial,
    'trial_days_left', trial_days_left,
    'trial_end_date', profile_record.trial_end_date,
    'has_active_subscription', has_active_subscription,
    'subscription_end', subscription_record.subscription_end,
    'subscription_status', COALESCE(subscription_record.status, 'none')
  );
END;
$$;

-- Function to activate subscription after payment
CREATE OR REPLACE FUNCTION public.activate_subscription(_user_id UUID, _paystack_reference TEXT, _amount NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert or update subscription
  INSERT INTO public.subscriptions (
    user_id,
    status,
    subscription_start,
    subscription_end,
    paystack_reference,
    amount,
    updated_at
  ) VALUES (
    _user_id,
    'active',
    now(),
    now() + INTERVAL '30 days',
    _paystack_reference,
    _amount,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = 'active',
    subscription_start = now(),
    subscription_end = now() + INTERVAL '30 days',
    paystack_reference = _paystack_reference,
    amount = _amount,
    updated_at = now();
  
  -- Mark trial as used
  UPDATE profiles
  SET trial_used = true, updated_at = now()
  WHERE user_id = _user_id;
  
  RETURN TRUE;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();