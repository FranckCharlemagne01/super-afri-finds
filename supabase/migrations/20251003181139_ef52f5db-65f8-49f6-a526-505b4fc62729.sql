-- Add public key columns to paystack_config table
ALTER TABLE paystack_config 
ADD COLUMN IF NOT EXISTS encrypted_public_key_test TEXT,
ADD COLUMN IF NOT EXISTS encrypted_public_key_live TEXT;

-- Add comment for clarity
COMMENT ON COLUMN paystack_config.encrypted_public_key_test IS 'Encrypted Paystack public key for test mode';
COMMENT ON COLUMN paystack_config.encrypted_public_key_live IS 'Encrypted Paystack public key for live mode';