-- Create table for storing encrypted Paystack configuration
CREATE TABLE IF NOT EXISTS public.paystack_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encrypted_key_test TEXT,
  encrypted_key_live TEXT,
  mode TEXT NOT NULL DEFAULT 'test' CHECK (mode IN ('test', 'live')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paystack_config ENABLE ROW LEVEL SECURITY;

-- Only superadmins can access this table
CREATE POLICY "Only superadmins can manage Paystack config"
  ON public.paystack_config
  FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::user_role));

-- Create trigger for updated_at
CREATE TRIGGER update_paystack_config_updated_at
  BEFORE UPDATE ON public.paystack_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default row (there should only be one row in this table)
INSERT INTO public.paystack_config (mode) VALUES ('test')
ON CONFLICT DO NOTHING;