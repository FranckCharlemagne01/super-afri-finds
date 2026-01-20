-- Add auth validation to notification trigger functions for defense-in-depth security

-- Drop ALL existing triggers that might use these functions
DROP TRIGGER IF EXISTS trigger_new_order_notification ON orders;
DROP TRIGGER IF EXISTS trigger_order_status_notification ON orders;
DROP TRIGGER IF EXISTS trigger_new_message_notification ON messages;
DROP TRIGGER IF EXISTS trigger_order_notification ON orders;

-- Drop existing functions with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS create_notification_on_order() CASCADE;
DROP FUNCTION IF EXISTS create_notification_on_message() CASCADE;

-- Recreate notification function for orders with auth validation
CREATE OR REPLACE FUNCTION create_notification_on_order()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  target_user_id uuid;
  notification_title text;
  notification_message text;
  notification_type text;
  notification_link text;
  current_user_id uuid;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- Defense-in-depth: Validate auth context
  IF current_user_id IS NULL THEN
    RAISE WARNING '[Security] Order trigger without auth context - operation: %, order_id: %', TG_OP, NEW.id;
    -- Still allow operation (RLS is primary protection) but log warning
  ELSIF TG_OP = 'INSERT' AND current_user_id != NEW.customer_id THEN
    RAISE WARNING '[Security] Order INSERT by non-customer: auth=% customer=%', current_user_id, NEW.customer_id;
  ELSIF TG_OP = 'UPDATE' AND current_user_id NOT IN (NEW.seller_id, NEW.customer_id) THEN
    RAISE WARNING '[Security] Order UPDATE by unauthorized user: auth=% seller=% customer=%', current_user_id, NEW.seller_id, NEW.customer_id;
  END IF;

  -- Handle new order - notify seller
  IF TG_OP = 'INSERT' THEN
    target_user_id := NEW.seller_id;
    notification_title := 'Nouvelle commande reçue';
    notification_message := format('Vous avez reçu une commande pour "%s" de %s', NEW.product_title, NEW.customer_name);
    notification_type := 'new_order';
    notification_link := '/seller-dashboard?tab=orders';
  
  -- Handle order status update - notify customer
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    target_user_id := NEW.customer_id;
    
    CASE NEW.status
      WHEN 'confirmed' THEN
        notification_title := 'Commande confirmée';
        notification_message := format('Votre commande pour "%s" a été confirmée par le vendeur', NEW.product_title);
      WHEN 'shipped' THEN
        notification_title := 'Commande expédiée';
        notification_message := format('Votre commande pour "%s" a été expédiée', NEW.product_title);
      WHEN 'delivered' THEN
        notification_title := 'Commande livrée';
        notification_message := format('Votre commande pour "%s" a été livrée', NEW.product_title);
      WHEN 'cancelled' THEN
        notification_title := 'Commande annulée';
        notification_message := format('Votre commande pour "%s" a été annulée', NEW.product_title);
      ELSE
        -- Don't notify for other status changes
        RETURN NEW;
    END CASE;
    
    notification_type := 'order_status';
    notification_link := '/my-orders';
  ELSE
    -- No notification needed
    RETURN NEW;
  END IF;
  
  -- Insert notification (system operation - allowed by RLS)
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (target_user_id, notification_title, notification_message, notification_type, notification_link);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Notification creation failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate notification function for messages with auth validation
CREATE OR REPLACE FUNCTION create_notification_on_message()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- Defense-in-depth: Validate sender matches auth context
  IF current_user_id IS NULL THEN
    RAISE WARNING '[Security] Message trigger without auth context - message_id: %', NEW.id;
  ELSIF current_user_id != NEW.sender_id THEN
    RAISE WARNING '[Security] Message INSERT by non-sender: auth=% sender=%', current_user_id, NEW.sender_id;
  END IF;

  -- Insert notification for recipient (system operation - allowed by RLS)
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    NEW.recipient_id,
    'Nouveau message reçu',
    left(NEW.content, 100),
    'new_message',
    '/messages'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Message notification creation failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER trigger_new_order_notification
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_order();

CREATE TRIGGER trigger_order_status_notification
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_order();

CREATE TRIGGER trigger_new_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_message();