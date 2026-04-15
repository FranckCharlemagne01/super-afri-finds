
-- Update order notification trigger to include reference_id
CREATE OR REPLACE FUNCTION public.create_notification_on_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id uuid;
  notification_title text;
  notification_message text;
  notification_type text;
  notification_link text;
  notification_ref text;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE WARNING '[Security] Order trigger without auth context - operation: %, order_id: %', TG_OP, NEW.id;
  ELSIF TG_OP = 'INSERT' AND current_user_id != NEW.customer_id THEN
    RAISE WARNING '[Security] Order INSERT by non-customer: auth=% customer=%', current_user_id, NEW.customer_id;
  ELSIF TG_OP = 'UPDATE' AND current_user_id NOT IN (NEW.seller_id, NEW.customer_id) THEN
    RAISE WARNING '[Security] Order UPDATE by unauthorized user: auth=% seller=% customer=%', current_user_id, NEW.seller_id, NEW.customer_id;
  END IF;

  notification_ref := NEW.id::text;

  IF TG_OP = 'INSERT' THEN
    target_user_id := NEW.seller_id;
    notification_title := 'Nouvelle commande reçue';
    notification_message := format('Vous avez reçu une commande pour "%s" de %s', NEW.product_title, NEW.customer_name);
    notification_type := 'new_order';
    notification_link := '/seller-dashboard?tab=orders';
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    target_user_id := NEW.customer_id;
    
    CASE NEW.status
      WHEN 'confirmed' THEN
        notification_title := 'Commande confirmée';
        notification_message := format('Votre commande pour "%s" a été confirmée par le vendeur', NEW.product_title);
      WHEN 'shipped' THEN
        notification_title := 'Commande expédiée';
        notification_message := format('Votre commande pour "%s" a été expédiée', NEW.product_title);
        notification_type := 'order_shipped';
      WHEN 'delivered' THEN
        notification_title := 'Commande livrée';
        notification_message := format('Votre commande pour "%s" a été livrée', NEW.product_title);
        notification_type := 'order_delivered';
      WHEN 'cancelled' THEN
        notification_title := 'Commande annulée';
        notification_message := format('Votre commande pour "%s" a été annulée', NEW.product_title);
      ELSE
        RETURN NEW;
    END CASE;
    
    IF notification_type IS NULL THEN
      notification_type := 'order_status';
    END IF;
    notification_link := '/my-orders';
  ELSE
    RETURN NEW;
  END IF;
  
  INSERT INTO notifications (user_id, title, message, type, link, reference_id)
  VALUES (target_user_id, notification_title, notification_message, notification_type, notification_link, notification_ref);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Notification creation failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update message notification trigger to include reference_id
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

  INSERT INTO notifications (user_id, title, message, type, link, reference_id)
  VALUES (
    NEW.recipient_id,
    'Nouveau message reçu',
    left(NEW.content, 100),
    'new_message',
    '/messages',
    NEW.sender_id::text
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Message notification creation failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;
