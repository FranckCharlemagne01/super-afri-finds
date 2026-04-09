CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_on_publication_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE 'HTTP POST envoyé pour seller_id: %', NEW.seller_id;

  PERFORM net.http_post(
    'https://zqskpspbyzptzjcoitwt.supabase.co/functions/v1/send-bonus-sms'::text,
    json_build_object(
      'seller_id', NEW.seller_id,
      'expires_at', NEW.expires_at
    )::text,
    '{"Content-Type": "application/json"}'::jsonb,
    5000
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_publication_bonus ON public.publication_bonuses;
CREATE TRIGGER trg_notify_publication_bonus
AFTER INSERT ON public.publication_bonuses
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_publication_bonus();