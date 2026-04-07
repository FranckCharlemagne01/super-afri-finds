
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create or replace the function to also send SMS via edge function
CREATE OR REPLACE FUNCTION public.notify_on_publication_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _phone text;
  _supabase_url text := 'https://zqskpspbyzptzjcoitwt.supabase.co';
  _anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxc2twc3BieXpwdHpqY29pdHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NjU4MTksImV4cCI6MjA3MzA0MTgxOX0.CIgTsYIxD--vDwa-4nebRWglksMaUfxdBFgBmeRSYns';
BEGIN
  -- Insert in-app notification
  INSERT INTO public.notifications (user_id, title, message, type, icon, link)
  VALUES (
    NEW.seller_id,
    '🎁 Bonus de publication reçu !',
    '✨ Vous avez reçu un bonus Djassa ! Publiez jusqu''à ' || NEW.max_products || ' produits gratuitement. Valable jusqu''au ' || to_char(NEW.expires_at, 'DD/MM/YYYY') || ' 🚀',
    'bonus',
    '🎁',
    '/seller'
  );

  -- Get seller phone number
  SELECT phone INTO _phone FROM public.profiles WHERE user_id = NEW.seller_id LIMIT 1;

  -- Send SMS via edge function if phone exists
  IF _phone IS NOT NULL AND length(trim(_phone)) > 0 THEN
    PERFORM extensions.http_post(
      url := _supabase_url || '/functions/v1/send-bonus-sms',
      body := json_build_object(
        'bonus_id', NEW.id,
        'seller_id', NEW.seller_id,
        'expires_at', NEW.expires_at,
        'phone', _phone
      )::text,
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _anon_key
      )::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$;
