import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RecommendationHistory {
  categories: { [key: string]: number }; // category: visit count
  shops: { [key: string]: number }; // shop_id: visit count
  lastUpdated: string;
}

interface Shop {
  id: string;
  shop_name: string;
  shop_slug: string;
  shop_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  seller_id: string;
  created_at: string;
  subscription_active: boolean;
}

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  images: string[];
  seller_id: string;
  shop_id?: string;
  original_price?: number;
  discount_percentage?: number;
  rating?: number;
  reviews_count?: number;
  badge?: string;
  is_flash_sale?: boolean;
  stock_quantity?: number;
  is_active?: boolean;
  is_boosted?: boolean;
  boosted_until?: string;
  is_sold?: boolean;
  created_at?: string;
  [key: string]: any;
}

const STORAGE_KEY = 'djassa_recommendations_history';
const MAX_HISTORY_SIZE = 50;

export function useRecommendations() {
  const [history, setHistory] = useState<RecommendationHistory>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { categories: {}, shops: {}, lastUpdated: new Date().toISOString() };
      }
    }
    return { categories: {}, shops: {}, lastUpdated: new Date().toISOString() };
  });

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  // Track category visit
  const trackCategoryVisit = useCallback((category: string) => {
    setHistory(prev => {
      const newCategories = { ...prev.categories };
      newCategories[category] = (newCategories[category] || 0) + 1;
      
      // Limit history size
      const entries = Object.entries(newCategories);
      if (entries.length > MAX_HISTORY_SIZE) {
        entries.sort((a, b) => b[1] - a[1]);
        const limited = Object.fromEntries(entries.slice(0, MAX_HISTORY_SIZE));
        return { ...prev, categories: limited, lastUpdated: new Date().toISOString() };
      }
      
      return { ...prev, categories: newCategories, lastUpdated: new Date().toISOString() };
    });
  }, []);

  // Track shop visit
  const trackShopVisit = useCallback((shopId: string) => {
    setHistory(prev => {
      const newShops = { ...prev.shops };
      newShops[shopId] = (newShops[shopId] || 0) + 1;
      
      // Limit history size
      const entries = Object.entries(newShops);
      if (entries.length > MAX_HISTORY_SIZE) {
        entries.sort((a, b) => b[1] - a[1]);
        const limited = Object.fromEntries(entries.slice(0, MAX_HISTORY_SIZE));
        return { ...prev, shops: limited, lastUpdated: new Date().toISOString() };
      }
      
      return { ...prev, shops: newShops, lastUpdated: new Date().toISOString() };
    });
  }, []);

  // Get similar shops based on category with intelligent scoring
  const getSimilarShops = useCallback(async (
    currentShopId: string,
    mainCategory: string,
    limit: number = 6
  ): Promise<Shop[]> => {
    try {
      // Get all active shops except current
      const { data: shops, error } = await supabase
        .from('seller_shops')
        .select('*')
        .eq('is_active', true)
        .neq('id', currentShopId);

      if (error || !shops) return [];

      // Score shops based on category match and visit history
      const scoredShops = await Promise.all(
        shops.map(async (shop) => {
          let score = 0;

          // Check if shop has products in the same category
          const { data: products } = await supabase
            .from('products')
            .select('category')
            .eq('shop_id', shop.id)
            .eq('is_active', true);

          if (products && products.length > 0) {
            // Main category match: +10 points
            const hasMainCategory = products.some(p => p.category === mainCategory);
            if (hasMainCategory) score += 10;

            // Check for frequently visited categories: +5 points per match
            const visitedCategories = Object.keys(history.categories);
            products.forEach(p => {
              if (visitedCategories.includes(p.category)) {
                score += 5 * (history.categories[p.category] || 1);
              }
            });

            // Previous shop visits: +3 points per visit
            if (history.shops[shop.id]) {
              score += 3 * history.shops[shop.id];
            }

            // Premium shops: +2 points
            if (shop.subscription_active) {
              score += 2;
            }
          }

          return { shop, score };
        })
      );

      // Sort by score and return top results
      return scoredShops
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.shop);
    } catch (error) {
      console.error('Error fetching similar shops:', error);
      return [];
    }
  }, [history]);

  // Get similar products based on category with intelligent scoring
  const getSimilarProducts = useCallback(async (
    currentProductId: string,
    currentShopId: string | undefined,
    category: string,
    limit: number = 8
  ): Promise<Product[]> => {
    try {
      // Get products from other shops in same or related categories
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .neq('id', currentProductId);

      // Exclude current shop if provided
      if (currentShopId) {
        query = query.neq('shop_id', currentShopId);
      }

      const { data: products, error } = await query;

      if (error || !products) return [];

      // Score products based on category match and visit history
      const scoredProducts = products.map(product => {
        let score = 0;

        // Exact category match: +10 points
        if (product.category === category) {
          score += 10;
        }

        // Frequently visited category: +5 points
        if (history.categories[product.category]) {
          score += 5 * history.categories[product.category];
        }

        // Boosted products: +3 points
        if (product.is_boosted && product.boosted_until && new Date(product.boosted_until) > new Date()) {
          score += 3;
        }

        // Flash sale: +2 points
        if (product.is_flash_sale) {
          score += 2;
        }

        // Discount: +1 point
        if (product.discount_percentage && product.discount_percentage > 0) {
          score += 1;
        }

        return { product, score };
      });

      // Sort by score and return top results
      return scoredProducts
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.product);
    } catch (error) {
      console.error('Error fetching similar products:', error);
      return [];
    }
  }, [history]);

  // Get products from same shop
  const getShopProducts = useCallback(async (
    shopId: string,
    currentProductId: string,
    limit: number = 6
  ): Promise<Product[]> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .neq('id', currentProductId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data || [];
    } catch (error) {
      console.error('Error fetching shop products:', error);
      return [];
    }
  }, []);

  return {
    trackCategoryVisit,
    trackShopVisit,
    getSimilarShops,
    getSimilarProducts,
    getShopProducts,
    history,
  };
}
