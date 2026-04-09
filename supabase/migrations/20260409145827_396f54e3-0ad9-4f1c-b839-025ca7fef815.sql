
-- Ensure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop any existing triggers on publication_bonuses to avoid duplicates
DROP TRIGGER IF EXISTS trg_notify_publication_bonus ON public.publication_bonuses;
DROP TRIGGER IF EXISTS notify_on_publication_bonus_trigger ON public.publication_bonuses;

-- Recreate the function using net.http_post
CREATE OR REPLACE FUNCTION public.notify_on_publication_bonus()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'Calling Edge Function for seller_id: %', NEW.seller_id;

  PERFORM net.http_post(
    url := 'https://zqskpspbyzptzjcoitwt.supabase.co/functions/v1/send-bonus-sms',
    body := json_build_object(
      'seller_id', NEW.seller_id,
      'expires_at', NEW.expires_at
    )::text,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create single trigger AFTER INSERT
CREATE TRIGGER trg_notify_publication_bonus
  AFTER INSERT ON public.publication_bonuses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_publication_bonus();
