-- Drop the previous triggers that use net.http_post (not available in standard Supabase)
DROP TRIGGER IF EXISTS trigger_order_notification ON public.orders;
DROP TRIGGER IF EXISTS trigger_message_notification ON public.messages;
DROP FUNCTION IF EXISTS public.trigger_push_notification();

-- Create a simpler function that only creates in-app notifications
CREATE OR REPLACE FUNCTION public.create_notification_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  notification_title TEXT;
  notification_body TEXT;
  notification_url TEXT;
  target_user_id UUID;
  notification_type TEXT;
  notification_icon TEXT;
BEGIN
  -- NEW ORDER: notify seller
  IF TG_OP = 'INSERT' THEN
    target_user_id := NEW.seller_id;
    notification_title := 'Nouvelle commande !';
    notification_body := NEW.customer_name || ' a commandé ' || NEW.product_title;
    notification_url := '/seller-dashboard';
    notification_type := 'new_order';
    notification_icon := 'shopping-cart';
    
  -- ORDER STATUS CHANGE: notify customer
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    target_user_id := NEW.customer_id;
    
    CASE NEW.status
      WHEN 'confirmed' THEN
        notification_title := 'Commande confirmée';
        notification_body := 'Votre commande "' || NEW.product_title || '" a été confirmée';
        notification_icon := 'check-circle';
      WHEN 'shipped' THEN
        notification_title := 'Commande expédiée';
        notification_body := 'Votre commande "' || NEW.product_title || '" est en route';
        notification_icon := 'truck';
      WHEN 'delivered' THEN
        notification_title := 'Commande livrée';
        notification_body := 'Votre commande "' || NEW.product_title || '" a été livrée';
        notification_icon := 'package';
      WHEN 'cancelled' THEN
        notification_title := 'Commande annulée';
        notification_body := 'Votre commande "' || NEW.product_title || '" a été annulée';
        notification_icon := 'x-circle';
      ELSE
        RETURN NEW;
    END CASE;
    
    notification_url := '/my-orders';
    notification_type := 'order_status';
  ELSE
    RETURN NEW;
  END IF;
  
  -- Create in-app notification
  INSERT INTO public.notifications (user_id, type, title, message, link, icon, is_read)
  VALUES (target_user_id, notification_type, notification_title, notification_body, notification_url, notification_icon, false);
  
  RETURN NEW;
END;
$$;

-- Create function for message notifications
CREATE OR REPLACE FUNCTION public.create_notification_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create in-app notification for the recipient
  INSERT INTO public.notifications (user_id, type, title, message, link, icon, is_read)
  VALUES (
    NEW.recipient_id, 
    'new_message', 
    'Nouveau message', 
    SUBSTRING(NEW.content FROM 1 FOR 100),
    '/messages',
    'message-circle',
    false
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_order_notification
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_notification_on_order();

CREATE TRIGGER trigger_message_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_notification_on_message();