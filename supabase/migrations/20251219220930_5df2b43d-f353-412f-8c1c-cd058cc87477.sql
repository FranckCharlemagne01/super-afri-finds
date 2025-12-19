-- Create a function to send push notification via edge function
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  notification_title TEXT;
  notification_body TEXT;
  notification_url TEXT;
  notification_tag TEXT;
  target_user_id UUID;
  notification_type TEXT;
BEGIN
  -- Determine notification based on table and operation
  
  -- NEW ORDER: notify seller
  IF TG_TABLE_NAME = 'orders' AND TG_OP = 'INSERT' THEN
    target_user_id := NEW.seller_id;
    notification_title := '🛒 Nouvelle commande !';
    notification_body := NEW.customer_name || ' a commandé ' || NEW.product_title;
    notification_url := '/seller-dashboard';
    notification_tag := 'new-order';
    notification_type := 'new_order';
    
    -- Create in-app notification
    INSERT INTO public.notifications (user_id, type, title, message, link, icon, is_read)
    VALUES (target_user_id, notification_type, notification_title, notification_body, notification_url, 'shopping-cart', false);
    
    -- Call edge function for push notification
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'user_id', target_user_id::text,
        'title', notification_title,
        'body', notification_body,
        'url', notification_url,
        'tag', notification_tag
      )
    );
  
  -- ORDER STATUS CHANGE: notify customer
  ELSIF TG_TABLE_NAME = 'orders' AND TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    target_user_id := NEW.customer_id;
    
    CASE NEW.status
      WHEN 'confirmed' THEN
        notification_title := '✅ Commande confirmée';
        notification_body := 'Votre commande "' || NEW.product_title || '" a été confirmée';
      WHEN 'shipped' THEN
        notification_title := '🚚 Commande expédiée';
        notification_body := 'Votre commande "' || NEW.product_title || '" est en route';
      WHEN 'delivered' THEN
        notification_title := '📦 Commande livrée';
        notification_body := 'Votre commande "' || NEW.product_title || '" a été livrée';
      WHEN 'cancelled' THEN
        notification_title := '❌ Commande annulée';
        notification_body := 'Votre commande "' || NEW.product_title || '" a été annulée';
      ELSE
        notification_title := '📋 Mise à jour commande';
        notification_body := 'Statut de "' || NEW.product_title || '": ' || NEW.status;
    END CASE;
    
    notification_url := '/my-orders';
    notification_tag := 'order-status';
    notification_type := 'order_status';
    
    -- Create in-app notification
    INSERT INTO public.notifications (user_id, type, title, message, link, icon, is_read)
    VALUES (target_user_id, notification_type, notification_title, notification_body, notification_url, 'package', false);
    
    -- Call edge function for push notification
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'user_id', target_user_id::text,
        'title', notification_title,
        'body', notification_body,
        'url', notification_url,
        'tag', notification_tag
      )
    );
  
  -- NEW MESSAGE: notify recipient
  ELSIF TG_TABLE_NAME = 'messages' AND TG_OP = 'INSERT' THEN
    target_user_id := NEW.recipient_id;
    notification_title := '💬 Nouveau message';
    notification_body := SUBSTRING(NEW.content FROM 1 FOR 100);
    notification_url := '/messages';
    notification_tag := 'new-message';
    notification_type := 'new_message';
    
    -- Create in-app notification
    INSERT INTO public.notifications (user_id, type, title, message, link, icon, is_read)
    VALUES (target_user_id, notification_type, notification_title, notification_body, notification_url, 'message-circle', false);
    
    -- Call edge function for push notification
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'user_id', target_user_id::text,
        'title', notification_title,
        'body', notification_body,
        'url', notification_url,
        'tag', notification_tag
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for orders
DROP TRIGGER IF EXISTS trigger_order_notification ON public.orders;
CREATE TRIGGER trigger_order_notification
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_notification();

-- Create trigger for messages
DROP TRIGGER IF EXISTS trigger_message_notification ON public.messages;
CREATE TRIGGER trigger_message_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_notification();