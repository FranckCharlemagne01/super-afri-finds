-- Add premium status and payment tracking for sellers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paystack_reference TEXT;

-- Create payments table to track Paystack transactions
CREATE TABLE IF NOT EXISTS premium_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  paystack_reference TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on premium_payments table
ALTER TABLE premium_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for premium_payments table
CREATE POLICY "Users can view their own payments" 
ON premium_payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" 
ON premium_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage all payments" 
ON premium_payments 
FOR ALL 
USING (has_role(auth.uid(), 'superadmin'::user_role));

-- Update trigger for premium_payments
CREATE TRIGGER update_premium_payments_updated_at
BEFORE UPDATE ON premium_payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update products RLS policy to require premium status for sellers
DROP POLICY IF EXISTS "Sellers can insert their own products" ON products;
CREATE POLICY "Premium sellers can insert their own products" 
ON products 
FOR INSERT 
WITH CHECK (
  auth.uid() = seller_id 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_premium = true 
    AND (premium_expires_at IS NULL OR premium_expires_at > now())
  )
);

-- Function to update premium status after successful payment
CREATE OR REPLACE FUNCTION handle_premium_payment_success(
  _user_id UUID,
  _paystack_reference TEXT,
  _amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update payment status
  UPDATE premium_payments 
  SET 
    status = 'success',
    payment_date = now(),
    updated_at = now()
  WHERE paystack_reference = _paystack_reference 
    AND user_id = _user_id;
  
  -- Update user premium status (1 year access)
  UPDATE profiles 
  SET 
    is_premium = true,
    premium_expires_at = now() + INTERVAL '1 year',
    paystack_reference = _paystack_reference,
    updated_at = now()
  WHERE user_id = _user_id;
  
  RETURN TRUE;
END;
$$;