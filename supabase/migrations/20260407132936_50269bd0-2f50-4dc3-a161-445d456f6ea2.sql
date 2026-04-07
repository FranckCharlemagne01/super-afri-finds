
CREATE OR REPLACE FUNCTION public.notify_on_publication_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  exp_date text;
BEGIN
  exp_date := to_char(NEW.expires_at::timestamptz, 'DD/MM/YYYY');

  INSERT INTO public.notifications (user_id, title, message, type, link, icon)
  VALUES (
    NEW.seller_id,
    '🎁 Bonus de publication reçu !',
    '✨ Bonne nouvelle ! Vous avez reçu un bonus Djassa 🎁 Publiez vos produits gratuitement dès maintenant 🚀 ⏳ Valable jusqu''au ' || exp_date,
    'bonus',
    '/seller-dashboard?tab=compte',
    '🎁'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_on_publication_bonus failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_publication_bonus ON public.publication_bonus;

CREATE TRIGGER trg_notify_publication_bonus
AFTER INSERT ON public.publication_bonus
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_publication_bonus();
