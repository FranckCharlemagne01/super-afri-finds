
CREATE TABLE public.email_otp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_code text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '5 minutes')
);

ALTER TABLE public.email_otp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct OTP access" ON public.email_otp
  FOR ALL USING (false);

CREATE INDEX idx_email_otp_email ON public.email_otp (email);
CREATE INDEX idx_email_otp_expires ON public.email_otp (expires_at);
