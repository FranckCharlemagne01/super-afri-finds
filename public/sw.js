// Djassa Marketplace - Service Worker for PWA & Push Notifications
// Version 9 - NEVER cache HTML to prevent white page on custom domains
const CACHE_NAME = 'djassa-pwa-v9';
const DYNAMIC_CACHE = 'djassa-dynamic-v9';
const IMAGE_CACHE = 'djassa-images-v9';
const API_CACHE = 'djassa-api-v9';

// Maximum cache sizes
const MAX_DYNAMIC_CACHE = 150;
const MAX_IMAGE_CACHE = 300;
const MAX_API_CACHE = 100;

// Static assets to cache on install - Essential files only (others cached on demand)
// NOTE: We intentionally do NOT precache '/' because if a stale/incorrect index.html
// is ever cached (e.g. wrong deployment on a custom host), it can cause persistent
// "white page" failures until users manually clear site data.
const STATIC_ASSETS = ['/manifest.json', '/favicon.png'];

// Install event - minimal caching to avoid blank page issues
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker v9 installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential assets');
        // Use addAll with fallback for each file
        return Promise.allSettled(
          STATIC_ASSETS.map(asset => 
            cache.add(asset).catch(err => {
              console.warn('[SW] Could not cache:', asset, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Install complete, activating immediately');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
        // Still skip waiting even on error to not block the app
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches aggressively
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker v9 activating...');
  const currentCaches = [CACHE_NAME, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('djassa-') && !currentCaches.includes(name))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
      .then(() => {
        console.log('[SW] Service Worker v9 activated and controlling');
        return self.clients.matchAll();
      })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_READY', version: 9 });
        });
      })
      .catch(err => {
        console.error('[SW] Activation error:', err);
      })
  );
});

// Trim cache to maximum size (LRU-style: remove oldest entries)
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    const toDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

// Helper function to determine caching strategy and target cache
function getCacheConfig(request) {
  try {
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
      return { strategy: 'network-only', cache: null };
    }
    
    // CRITICAL: avoid caching HTML/navigation responses.
    // A stale index.html on a custom host can cause persistent white pages.
    if (request.mode === 'navigate') {
      // For navigation requests, always try network first with fast fallback
      // but DO NOT store HTML in cache.
      return { strategy: 'network-first-fast', cache: null };
    }
    
    // Skip cross-origin requests (except for CDN assets and Supabase storage)
    const isSupabaseStorage = url.hostname.includes('supabase.co') && url.pathname.includes('/storage/');
    const isCDN = url.hostname.includes('cdn.');
    
    if (!url.origin.includes(self.location.origin) && !isSupabaseStorage && !isCDN) {
      return { strategy: 'network-only', cache: null };
    }
    
    // Supabase storage images - cache aggressively
    if (isSupabaseStorage) {
      return { strategy: 'cache-first', cache: IMAGE_CACHE };
    }
    
    // Skip Supabase API calls - always network (except storage)
    if (url.hostname.includes('supabase.co')) {
      return { strategy: 'network-only', cache: null };
    }
    
    // Image files - aggressive caching
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i)) {
      return { strategy: 'cache-first', cache: IMAGE_CACHE };
    }
    
    // JS/CSS bundles with hash - cache first (immutable)
    if (url.pathname.match(/\.(js|css)$/) && url.pathname.includes('assets/')) {
      return { strategy: 'cache-first', cache: DYNAMIC_CACHE };
    }
    
    // Fonts - cache first
    if (url.pathname.match(/\.(woff|woff2|ttf|eot)$/)) {
      return { strategy: 'cache-first', cache: DYNAMIC_CACHE };
    }
    
    // HTML pages - network first with fast fallback, but DO NOT cache
    if (request.headers.get('accept')?.includes('text/html')) {
      return { strategy: 'network-first-fast', cache: null };
    }
    
    // JSON data - network first
    if (url.pathname.endsWith('.json')) {
      return { strategy: 'network-first-fast', cache: API_CACHE };
    }
    
    // Default: network first for reliability
    return { strategy: 'network-first-fast', cache: DYNAMIC_CACHE };
  } catch (err) {
    console.warn('[SW] getCacheConfig error:', err);
    return { strategy: 'network-only', cache: null };
  }
}

// Fetch event handler with optimized caching strategies
self.addEventListener('fetch', (event) => {
  try {
    const { strategy, cache: targetCache } = getCacheConfig(event.request);
    
    if (strategy === 'network-only') {
      return; // Let the browser handle it
    }
    
    if (strategy === 'cache-first') {
      event.respondWith(
        caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            return fetch(event.request)
              .then((response) => {
                if (response && response.status === 200) {
                  const responseClone = response.clone();
                  caches.open(targetCache).then((cache) => {
                    cache.put(event.request, responseClone);
                    if (targetCache === IMAGE_CACHE) {
                      trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE);
                    }
                  }).catch(() => {});
                }
                return response;
              })
              .catch((err) => {
                console.warn('[SW] Fetch failed for cache-first:', err);
                return new Response('', { status: 503 });
              });
          })
          .catch(() => fetch(event.request))
      );
      return;
    }
    
    // Network first with fast timeout (3s) - CRITICAL for avoiding blank pages
    if (strategy === 'network-first-fast') {
      event.respondWith(
        Promise.race([
          // Try network with 3s timeout
          fetch(event.request)
            .then((response) => {
              if (response && response.status === 200 && targetCache) {
                const responseClone = response.clone();
                caches.open(targetCache)
                  .then((cache) => cache.put(event.request, responseClone))
                  .catch(() => {});
              }
              return response;
            }),
          // Timeout after 3 seconds
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 3000)
          )
        ])
        .catch(() => {
          // Network failed or timed out, try cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
               // For HTML, don't force-fallback to '/' (can be stale). Let the browser
               // retry the original request.
               if (event.request.headers.get('accept')?.includes('text/html')) {
                 return fetch(event.request);
               }
              // Last resort: try network again without timeout
              return fetch(event.request);
            });
        })
      );
      return;
    }
    
    if (strategy === 'stale-while-revalidate') {
      event.respondWith(
        caches.match(event.request)
          .then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  const responseClone = networkResponse.clone();
                  caches.open(targetCache)
                    .then((cache) => cache.put(event.request, responseClone))
                    .catch(() => {});
                }
                return networkResponse;
              })
              .catch(() => cachedResponse);
            
            return cachedResponse || fetchPromise;
          })
          .catch(() => fetch(event.request))
      );
      return;
    }
    
    // Default: let browser handle
  } catch (err) {
    console.error('[SW] Fetch handler error:', err);
    // Don't intercept on error - let browser handle normally
  }
});

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Djassa Marketplace',
    body: 'Vous avez une nouvelle notification',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: 'djassa-notification',
    data: { url: '/' }
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || data.data
      };
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Voir' },
      { action: 'close', title: 'Fermer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// Message handler for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

