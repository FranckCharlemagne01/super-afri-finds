import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getProductImage } from '@/utils/productImageHelper';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category: string;
  images?: string[];
  seller_id: string;
  rating?: number;
  reviews_count?: number;
  badge?: string;
  is_flash_sale?: boolean;
  stock_quantity?: number;
  video_url?: string;
  is_boosted?: boolean;
  boosted_until?: string;
  shop_id?: string;
  is_sold?: boolean;
  is_active?: boolean;
  shop?: {
    shop_slug: string;
    shop_name: string;
  };
}

interface ProductCardProps {
  id: string;
  image: string;
  title: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  rating: number;
  reviews: number;
  badge?: string;
  shop_slug?: string;
  shop_name?: string;
  isFlashSale: boolean;
  seller_id: string;
  videoUrl?: string;
  isBoosted: boolean;
  boostedUntil?: string;
  stockQuantity?: number;
  isSold: boolean;
  isActive?: boolean;
}

// Global cache for products
const productsCache = {
  data: null as Product[] | null,
  timestamp: 0,
  staleTime: 60 * 1000, // 1 minute cache
};

/**
 * Optimized hook for fetching and caching products
 * - Uses in-memory cache with stale-while-revalidate pattern
 * - Prevents duplicate requests
 * - Supports background refresh
 */
export function useOptimizedProducts() {
  const [products, setProducts] = useState<Product[]>(productsCache.data || []);
  const [loading, setLoading] = useState(!productsCache.data);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const fetchProducts = useCallback(async (force = false) => {
    // Check cache validity
    const now = Date.now();
    const isCacheValid = productsCache.data && (now - productsCache.timestamp) < productsCache.staleTime;

    if (isCacheValid && !force) {
      setProducts(productsCache.data!);
      setLoading(false);
      return;
    }

    // Show cached data immediately while fetching fresh data
    if (productsCache.data) {
      setProducts(productsCache.data);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      if (!productsCache.data) {
        setLoading(true);
      }

      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          id, title, description, price, original_price, discount_percentage,
          category, images, seller_id, rating, reviews_count, badge,
          is_flash_sale, stock_quantity, video_url, is_boosted, boosted_until,
          shop_id, is_sold, is_active,
          shop:seller_shops!shop_id(shop_slug, shop_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(100); // Limit initial load

      if (fetchError) throw fetchError;

      if (isMountedRef.current) {
        const productData = data || [];
        productsCache.data = productData;
        productsCache.timestamp = Date.now();
        setProducts(productData);
        setError(null);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && isMountedRef.current) {
        console.error('Error fetching products:', err);
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchProducts();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProducts]);

  // Memoized derived data
  const { boostedProducts, flashSaleProducts, specialOffers, regularProducts } = useMemo(() => {
    const now = new Date();
    const boosted = products.filter(p => 
      p.is_boosted && p.boosted_until && new Date(p.boosted_until) > now
    );
    const flashSale = products.filter(p => p.is_flash_sale);
    const special = [...boosted, ...flashSale.filter(p => !boosted.find(b => b.id === p.id))];
    const regular = products.filter(p => !p.is_flash_sale && !boosted.find(b => b.id === p.id));

    return {
      boostedProducts: boosted,
      flashSaleProducts: flashSale,
      specialOffers: special,
      regularProducts: regular,
    };
  }, [products]);

  // Convert to ProductCard props
  const convertToCardProps = useCallback((product: Product): ProductCardProps => ({
    id: product.id,
    image: getProductImage(product.images, 0),
    title: product.title,
    originalPrice: product.original_price || product.price,
    salePrice: product.price,
    discount: product.discount_percentage || 0,
    rating: product.rating || 0,
    reviews: product.reviews_count || 0,
    badge: product.badge,
    shop_slug: product.shop?.shop_slug,
    shop_name: product.shop?.shop_name,
    isFlashSale: product.is_flash_sale || false,
    seller_id: product.seller_id,
    videoUrl: product.video_url,
    isBoosted: product.is_boosted || false,
    boostedUntil: product.boosted_until,
    stockQuantity: product.stock_quantity,
    isSold: product.is_sold || false,
    isActive: product.is_active,
  }), []);

  return {
    products,
    loading,
    error,
    refetch: () => fetchProducts(true),
    boostedProducts,
    flashSaleProducts,
    specialOffers,
    regularProducts,
    convertToCardProps,
  };
}

/**
 * Invalidate products cache
 * Call after product mutations
 */
export function invalidateProductsCache() {
  productsCache.data = null;
  productsCache.timestamp = 0;
}
