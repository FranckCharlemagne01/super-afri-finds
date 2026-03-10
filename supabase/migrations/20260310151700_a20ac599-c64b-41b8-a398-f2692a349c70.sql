
-- =====================================================
-- COMMISSION SYSTEM: Reserve, Refund, Validate
-- =====================================================

-- 1. Function to reserve commission when an order is created
CREATE OR REPLACE FUNCTION public.reserve_commission_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  commission_rate numeric;
  commission numeric;
  current_balance numeric;
BEGIN
  -- Get seller commission rate
  SELECT get_seller_commission_rate(NEW.seller_id) INTO commission_rate;
  
  -- Calculate commission (min 200 FCFA)
  commission := GREATEST(ROUND(NEW.total_amount * commission_rate / 100), 200);
  
  -- Check seller wallet balance
  SELECT wallet_balance_fcfa INTO current_balance
  FROM seller_tokens
  WHERE seller_id = NEW.seller_id;
  
  -- If no wallet record or insufficient balance, still allow order but don't reserve
  IF current_balance IS NULL OR current_balance < commission THEN
    -- Set commission info but mark as 'insufficient'
    NEW.commission_amount := commission;
    NEW.commission_status := 'insufficient';
    RETURN NEW;
  END IF;
  
  -- Reserve commission: deduct from wallet
  UPDATE seller_tokens
  SET wallet_balance_fcfa = wallet_balance_fcfa - commission,
      updated_at = now()
  WHERE seller_id = NEW.seller_id;
  
  -- Set commission info on the order
  NEW.commission_amount := commission;
  NEW.commission_status := 'reserved';
  
  RETURN NEW;
END;
$$;

-- Create trigger on order insert
DROP TRIGGER IF EXISTS trg_reserve_commission ON orders;
CREATE TRIGGER trg_reserve_commission
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION reserve_commission_on_order();

-- 2. Function to handle commission on order status change (cancel → refund, confirm → validate)
CREATE OR REPLACE FUNCTION public.handle_commission_on_order_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when status changes
  IF OLD.status = NEW.status AND OLD.is_confirmed_by_seller IS NOT DISTINCT FROM NEW.is_confirmed_by_seller THEN
    RETURN NEW;
  END IF;

  -- CANCELLATION: Refund the reserved commission
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    IF OLD.commission_status = 'reserved' AND OLD.commission_amount > 0 THEN
      -- Refund commission to seller wallet
      UPDATE seller_tokens
      SET wallet_balance_fcfa = wallet_balance_fcfa + OLD.commission_amount,
          updated_at = now()
      WHERE seller_id = NEW.seller_id;
      
      NEW.commission_status := 'refunded';
      
      -- Record refund transaction
      INSERT INTO token_transactions (
        seller_id, transaction_type, tokens_amount, price_paid, status
      ) VALUES (
        NEW.seller_id, 'commission_refund', 0, OLD.commission_amount, 'completed'
      );
    END IF;
  END IF;

  -- CONFIRMATION by seller: mark commission as pending_validation (48h timer starts)
  IF NEW.is_confirmed_by_seller = true AND (OLD.is_confirmed_by_seller IS NULL OR OLD.is_confirmed_by_seller = false) THEN
    IF OLD.commission_status = 'reserved' THEN
      NEW.commission_status := 'pending_validation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on order update
DROP TRIGGER IF EXISTS trg_handle_commission_update ON orders;
CREATE TRIGGER trg_handle_commission_update
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_commission_on_order_update();

-- 3. Function to validate commissions after 48h (called periodically or on-demand)
CREATE OR REPLACE FUNCTION public.validate_pending_commissions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validated_count integer := 0;
BEGIN
  UPDATE orders
  SET commission_status = 'validated',
      updated_at = now()
  WHERE commission_status = 'pending_validation'
    AND is_confirmed_by_seller = true
    AND updated_at < now() - interval '48 hours';
  
  GET DIAGNOSTICS validated_count = ROW_COUNT;
  RETURN validated_count;
END;
$$;

-- 4. Update cancel_order_by_customer to work with new trigger (trigger handles refund automatically)
-- No changes needed since the trigger fires on UPDATE

-- 5. Allow 'commission_refund' as a transaction_type in token_transactions
-- (The table uses text type, so no constraint to update)
