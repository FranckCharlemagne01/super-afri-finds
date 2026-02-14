
-- Marketing Posts table
CREATE TABLE public.marketing_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_audience TEXT DEFAULT 'all',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage marketing posts"
ON public.marketing_posts FOR ALL
USING (has_role(auth.uid(), 'superadmin'::user_role));

CREATE POLICY "Anyone can view active marketing posts"
ON public.marketing_posts FOR SELECT
USING (is_active = true);

-- Ambassadors / Affiliates table
CREATE TABLE public.ambassadors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  referral_link TEXT,
  commission_rate NUMERIC NOT NULL DEFAULT 0.05,
  status TEXT NOT NULL DEFAULT 'active',
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  invited_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT no_self_referral CHECK (user_id IS DISTINCT FROM invited_by)
);

ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage ambassadors"
ON public.ambassadors FOR ALL
USING (has_role(auth.uid(), 'superadmin'::user_role));

CREATE POLICY "Ambassadors can view their own record"
ON public.ambassadors FOR SELECT
USING (auth.uid() = user_id);

-- Referral tracking table
CREATE TABLE public.referral_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambassador_id UUID NOT NULL REFERENCES public.ambassadors(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage referral signups"
ON public.referral_signups FOR ALL
USING (has_role(auth.uid(), 'superadmin'::user_role));

CREATE POLICY "Ambassadors can view their own referrals"
ON public.referral_signups FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.ambassadors WHERE id = ambassador_id AND user_id = auth.uid()
));

-- Anti-fraud: trigger to prevent self-signup
CREATE OR REPLACE FUNCTION public.check_no_self_referral_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.ambassadors 
    WHERE id = NEW.ambassador_id AND user_id = NEW.referred_user_id
  ) THEN
    RAISE EXCEPTION 'Auto-parrainage interdit';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER prevent_self_referral_signup
BEFORE INSERT ON public.referral_signups
FOR EACH ROW EXECUTE FUNCTION public.check_no_self_referral_signup();

-- Affiliate commissions table
CREATE TABLE public.affiliate_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambassador_id UUID NOT NULL REFERENCES public.ambassadors(id) ON DELETE CASCADE,
  referral_signup_id UUID REFERENCES public.referral_signups(id),
  order_id UUID,
  order_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.05,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage affiliate commissions"
ON public.affiliate_commissions FOR ALL
USING (has_role(auth.uid(), 'superadmin'::user_role));

CREATE POLICY "Ambassadors can view their own commissions"
ON public.affiliate_commissions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.ambassadors WHERE id = ambassador_id AND user_id = auth.uid()
));

-- Triggers for updated_at
CREATE TRIGGER update_marketing_posts_updated_at
BEFORE UPDATE ON public.marketing_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ambassadors_updated_at
BEFORE UPDATE ON public.ambassadors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
