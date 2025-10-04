-- Create audit log table for tracking sensitive data access
CREATE TABLE IF NOT EXISTS public.order_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by UUID NOT NULL,
  order_id UUID NOT NULL,
  access_type TEXT NOT NULL, -- 'view', 'update', 'export'
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS on audit logs
ALTER TABLE public.order_access_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view audit logs
CREATE POLICY "Only superadmins can view audit logs"
ON public.order_access_logs
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::user_role));

-- Create improved get_seller_orders function with stricter validation and audit logging
CREATE OR REPLACE FUNCTION public.get_seller_orders()
RETURNS TABLE(
  id uuid,
  product_id uuid,
  product_title text,
  product_price numeric,
  quantity integer,
  total_amount numeric,
  status text,
  seller_id uuid,
  customer_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  customer_name text,
  customer_phone text,
  delivery_location text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  is_superadmin boolean;
BEGIN
  -- Get current user ID and verify authentication
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'PGRST';
  END IF;
  
  -- Check if user is superadmin
  is_superadmin := has_role(current_user_id, 'superadmin'::user_role);
  
  -- Log access attempt
  INSERT INTO public.order_access_logs (accessed_by, order_id, access_type, accessed_at)
  SELECT current_user_id, o.id, 'view', now()
  FROM public.orders o
  WHERE current_user_id = o.customer_id 
     OR current_user_id = o.seller_id 
     OR is_superadmin;
  
  -- Return orders with conditional data masking
  RETURN QUERY
  SELECT 
    o.id,
    o.product_id,
    o.product_title,
    o.product_price,
    o.quantity,
    o.total_amount,
    o.status,
    o.seller_id,
    o.customer_id,
    o.created_at,
    o.updated_at,
    -- Only show customer name to authorized users
    CASE 
      WHEN current_user_id = o.customer_id THEN o.customer_name
      WHEN current_user_id = o.seller_id THEN o.customer_name
      WHEN is_superadmin THEN o.customer_name
      ELSE 'Confidentiel'
    END::TEXT as customer_name,
    -- Only show customer phone to authorized users
    CASE 
      WHEN current_user_id = o.customer_id THEN o.customer_phone
      WHEN current_user_id = o.seller_id THEN o.customer_phone
      WHEN is_superadmin THEN o.customer_phone
      ELSE 'Confidentiel'
    END::TEXT as customer_phone,
    -- Only show delivery location to authorized users
    CASE 
      WHEN current_user_id = o.customer_id THEN o.delivery_location
      WHEN current_user_id = o.seller_id THEN o.delivery_location
      WHEN is_superadmin THEN o.delivery_location
      ELSE 'Confidentiel'
    END::TEXT as delivery_location
  FROM public.orders o
  WHERE 
    current_user_id = o.customer_id 
    OR current_user_id = o.seller_id 
    OR is_superadmin;
END;
$$;

-- Improve update_order_status with audit logging and stricter validation
CREATE OR REPLACE FUNCTION public.update_order_status(order_id uuid, new_status text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_seller_id UUID;
  current_user_id UUID;
  is_superadmin BOOLEAN;
BEGIN
  -- Get current user and verify authentication
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'PGRST';
  END IF;
  
  -- Validate status input to prevent injection
  IF new_status NOT IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status USING ERRCODE = 'PGRST';
  END IF;
  
  -- Get order seller_id and validate order exists
  SELECT seller_id INTO order_seller_id
  FROM orders
  WHERE id = order_id;
  
  IF order_seller_id IS NULL THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'PGRST';
  END IF;
  
  -- Check authorization
  is_superadmin := has_role(current_user_id, 'superadmin'::user_role);
  
  IF order_seller_id != current_user_id AND NOT is_superadmin THEN
    RAISE EXCEPTION 'Unauthorized: You can only update your own orders' USING ERRCODE = 'PGRST';
  END IF;
  
  -- Log the update attempt
  INSERT INTO public.order_access_logs (accessed_by, order_id, access_type, accessed_at)
  VALUES (current_user_id, order_id, 'update', now());
  
  -- Update order status
  UPDATE orders 
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = order_id;
  
  RETURN TRUE;
END;
$$;

-- Add index for better audit log performance
CREATE INDEX IF NOT EXISTS idx_order_access_logs_accessed_by ON public.order_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_order_access_logs_order_id ON public.order_access_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_access_logs_accessed_at ON public.order_access_logs(accessed_at DESC);