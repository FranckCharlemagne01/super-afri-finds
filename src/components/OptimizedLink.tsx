import React, { memo, useCallback } from 'react';
import { Link, LinkProps, useNavigate } from 'react-router-dom';
import { usePrefetch } from '@/hooks/usePrefetch';
import { cn } from '@/lib/utils';

interface OptimizedLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  prefetch?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Optimized Link component with prefetching on hover
 * Improves navigation performance by preloading route components
 */
export const OptimizedLink = memo(function OptimizedLink({
  to,
  prefetch = true,
  className,
  children,
  ...props
}: OptimizedLinkProps) {
  const { prefetchOnHover, cancelPrefetch } = usePrefetch();

  const handleMouseEnter = useCallback(() => {
    if (prefetch) {
      prefetchOnHover(to);
    }
  }, [prefetch, prefetchOnHover, to]);

  const handleMouseLeave = useCallback(() => {
    cancelPrefetch();
  }, [cancelPrefetch]);

  return (
    <Link
      to={to}
      className={className}
      onMouseEnter={handleMouseEnter}
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
  children: React.ReactNode;
}

/**
 * Button that prefetches a route on hover
 * Useful for buttons that navigate programmatically
 */
export const PrefetchButton = memo(function PrefetchButton({
  route,
  children,
  className,
  onClick,
  ...props
}: PrefetchButtonProps) {
  const navigate = useNavigate();
  const { prefetchOnHover, cancelPrefetch } = usePrefetch();

  const handleMouseEnter = useCallback(() => {
    prefetchOnHover(route);
  }, [prefetchOnHover, route]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) {
      navigate(route);
    }
  }, [navigate, onClick, route]);

  return (
    <button
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={cancelPrefetch}
      onFocus={handleMouseEnter}
      onBlur={cancelPrefetch}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
});
