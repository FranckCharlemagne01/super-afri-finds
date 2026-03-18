import { lazy, ComponentType } from 'react';

/**
 * Wrapper around React.lazy that retries failed dynamic imports up to `maxRetries` times.
 * On final failure it does a cache-busting full page reload (once per session).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  maxRetries = 2,
): React.LazyExoticComponent<T> {
  return lazy(() => retryImport(importFn, maxRetries));
}

async function retryImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retriesLeft: number,
): Promise<{ default: T }> {
  try {
    return await importFn();
  } catch (err) {
    if (retriesLeft > 0) {
      // Wait briefly before retrying (200ms, then 600ms)
      await new Promise((r) => setTimeout(r, (3 - retriesLeft) * 400 + 200));
      return retryImport(importFn, retriesLeft - 1);
    }

    // All retries exhausted → force a cache-busting reload (once per session)
    const key = 'djassa:chunk_reload';
    if (sessionStorage.getItem(key) !== '1') {
      sessionStorage.setItem(key, '1');
      console.warn('[lazyWithRetry] All retries failed, reloading page', err);
      const url = new URL(window.location.href);
      url.searchParams.set('v', String(Date.now()));
      window.location.replace(url.toString());
    }

    // If we already reloaded once, re-throw so the error boundary catches it
    throw err;
  }
}
