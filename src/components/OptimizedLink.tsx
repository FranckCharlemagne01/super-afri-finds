/**
 * OptimizedLink Component
 * Link component with built-in prefetching on hover/touch
 * Provides instant navigation by preloading routes and data
 */

import React, { memo, useCallback, useRef } from 'react';
import { Link, LinkProps, useNavigate } from 'react-router-dom';
import { usePrefetch } from '@/hooks/usePrefetch';
import { prefetchSellerDashboard, prefetchBuyerDashboard } from '@/hooks/useDashboardPrefetch';
import { prefetchProduct } from '@/hooks/useProductCache';
import { cn } from '@/lib/utils';

interface OptimizedLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  prefetch?: boolean;
  prefetchData?: boolean;
  userId?: string | null;
  isSeller?: boolean;
  productId?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Optimized Link component with prefetching on hover
 * Improves navigation performance by preloading route components and data
 */
export const OptimizedLink = memo(function OptimizedLink({
  to,
  prefetch = true,
  prefetchData = false,
  userId,
  isSeller,
  productId,
  className,
  children,
  ...props
}: OptimizedLinkProps) {
  const { prefetchOnHover, cancelPrefetch } = usePrefetch();
  const prefetchedRef = useRef(false);

  const handlePrefetch = useCallback(() => {
    if (!prefetch || prefetchedRef.current) return;
    
    // Prefetch route component
    prefetchOnHover(to);

    // Prefetch data if enabled
    if (prefetchData) {
      if (to.includes('seller-dashboard') && userId) {
        prefetchSellerDashboard(userId);
        prefetchedRef.current = true;
      } else if (to.includes('buyer-dashboard') && userId) {
        prefetchBuyerDashboard(userId);
        prefetchedRef.current = true;
      }
      
      if (productId) {
        prefetchProduct(productId);
        prefetchedRef.current = true;
      }
    }
  }, [prefetch, prefetchOnHover, to, prefetchData, userId, productId]);

  const handleMouseEnter = useCallback(() => {
    handlePrefetch();
  }, [handlePrefetch]);

  const handleTouchStart = useCallback(() => {
    handlePrefetch();
  }, [handlePrefetch]);

  const handleMouseLeave = useCallback(() => {
    cancelPrefetch();
  }, [cancelPrefetch]);

  return (
    <Link
      to={to}
      className={className}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      {...props}
    >
      {children}
    </Link>
  );
});

interface PrefetchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  route: string;
  prefetchData?: boolean;
  userId?: string | null;
  isSeller?: boolean;
  children: React.ReactNode;
}

/**
 * Button that prefetches a route on hover
 * Useful for buttons that navigate programmatically
 */
export const PrefetchButton = memo(function PrefetchButton({
  route,
  prefetchData = false,
  userId,
  isSeller,
  children,
  className,
  onClick,
  ...props
}: PrefetchButtonProps) {
  const navigate = useNavigate();
  const { prefetchOnHover, cancelPrefetch } = usePrefetch();
  const prefetchedRef = useRef(false);

  const handlePrefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    
    prefetchOnHover(route);

    if (prefetchData) {
      if (route.includes('seller-dashboard') && userId) {
        prefetchSellerDashboard(userId);
        prefetchedRef.current = true;
      } else if (route.includes('buyer-dashboard') && userId) {
        prefetchBuyerDashboard(userId);
        prefetchedRef.current = true;
      }
    }
  }, [prefetchOnHover, route, prefetchData, userId]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) {
      navigate(route);
    }
  }, [navigate, onClick, route]);

  return (
    <button
      className={className}
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
      onMouseLeave={cancelPrefetch}
      onFocus={handlePrefetch}
      onBlur={cancelPrefetch}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
});
