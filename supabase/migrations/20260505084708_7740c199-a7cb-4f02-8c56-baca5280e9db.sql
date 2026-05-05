CREATE OR REPLACE FUNCTION public.create_notification_on_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE WARNING '[Security] Message trigger without auth context - message_id: %', NEW.id;
  ELSIF current_user_id != NEW.sender_id THEN
    RAISE WARNING '[Security] Message INSERT by non-sender: auth=% sender=%', current_user_id, NEW.sender_id;
  END IF;

  -- reference_id encodes both the conversation peer (sender) and the precise message
  -- format: "<sender_id>:<message_id>" so the frontend can deep-link to the exact message.
  INSERT INTO notifications (user_id, title, message, type, link, reference_id)
  VALUES (
    NEW.recipient_id,
    'Nouveau message reçu',
    left(NEW.content, 100),
    'new_message',
    '/messages',
    NEW.sender_id::text || ':' || NEW.id::text
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Message notification creation failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;