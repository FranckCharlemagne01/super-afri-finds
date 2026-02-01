import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/hooks/use-toast';

export interface BusinessStats {
  total_revenue: number;
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  total_commissions: number;
  commissions_month: number;
  total_orders: number;
  orders_today: number;
  orders_week: number;
  orders_month: number;
  orders_pending: number;
  orders_delivered: number;
  orders_cancelled: number;
  total_shops: number;
  shops_with_subscription: number;
  new_shops_month: number;
  total_customers: number;
  active_customers_month: number;
  average_order_value: number;
  total_products: number;
  boosted_products: number;
  token_revenue: number;
  subscription_revenue: number;
  total_visitors: number;
  visitors_today: number;
  visitors_month: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  orders: number;
  commissions: number;
}

export interface ShopPerformance {
  id: string;
  shop_name: string;
  logo_url: string | null;
  is_active: boolean;
  subscription_active: boolean;
  total_revenue: number;
  total_orders: number;
  total_products: number;
}

export interface TopProduct {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string | null;
  total_sales: number;
  total_revenue: number;
}

export interface CategoryPerformance {
  category: string;
  product_count: number;
  order_count: number;
  revenue: number;
}

export const useBusinessDashboard = () => {
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenueChartData[]>([]);
  const [topShops, setTopShops] = useState<ShopPerformance[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSuperAdmin) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [statsRes, chartRes, shopsRes, productsRes, categoriesRes] = await Promise.all([
        supabase.rpc('get_business_dashboard_stats'),
        supabase.rpc('get_business_revenue_chart', { _days: 30 }),
        supabase.rpc('get_top_performing_shops', { _limit: 10 }),
        supabase.rpc('get_top_selling_products', { _limit: 10 }),
        supabase.rpc('get_category_performance'),
      ]);

      if (statsRes.error) throw statsRes.error;
      if (chartRes.error) throw chartRes.error;
      if (shopsRes.error) throw shopsRes.error;
      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setStats(statsRes.data as unknown as BusinessStats);
      setRevenueChart((chartRes.data || []) as unknown as RevenueChartData[]);
      setTopShops((shopsRes.data || []) as unknown as ShopPerformance[]);
      setTopProducts((productsRes.data || []) as unknown as TopProduct[]);
      setCategoryPerformance((categoriesRes.data || []) as unknown as CategoryPerformance[]);
    } catch (err: any) {
      console.error('Error fetching business data:', err);
      setError(err.message || 'Failed to load business data');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données business.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!roleLoading && isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin, roleLoading, fetchData]);

  return {
    stats,
    revenueChart,
    topShops,
    topProducts,
    categoryPerformance,
    loading: loading || roleLoading,
    error,
    refetch: fetchData,
    isAuthorized: isSuperAdmin,
  };
};
