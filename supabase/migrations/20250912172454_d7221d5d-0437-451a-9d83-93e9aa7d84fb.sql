-- Corriger le problème de search_path pour la fonction handle_article_payment_success
CREATE OR REPLACE FUNCTION public.handle_article_payment_success(
  _user_id uuid,
  _paystack_reference text,
  _amount numeric,
  _product_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mettre à jour le statut de paiement
  UPDATE premium_payments 
  SET 
    status = 'completed',
    payment_date = now(),
    is_product_published = true,
    product_data = _product_data
  WHERE paystack_reference = _paystack_reference;

  -- Publier l'article automatiquement
  INSERT INTO products (
    seller_id,
    title,
    description,
    price,
    original_price,
    discount_percentage,
    category,
    stock_quantity,
    is_active,
    is_flash_sale,
    badge,
    images,
    video_url
  ) 
  SELECT 
    _user_id,
    _product_data->>'title',
    _product_data->>'description',
    (_product_data->>'price')::numeric,
    NULLIF(_product_data->>'original_price', '')::numeric,
    NULLIF(_product_data->>'discount_percentage', '')::integer,
    _product_data->>'category',
    COALESCE((_product_data->>'stock_quantity')::integer, 0),
    true, -- is_active
    COALESCE((_product_data->>'is_flash_sale')::boolean, false),
    NULLIF(_product_data->>'badge', ''),
    CASE 
      WHEN _product_data->>'images' IS NOT NULL AND _product_data->>'images' != '[]' 
      THEN (_product_data->>'images')::text[]
      ELSE '{}'::text[]
    END,
    NULLIF(_product_data->>'video_url', '');
END;
$$;