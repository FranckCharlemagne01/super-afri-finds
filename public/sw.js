// Djassa Marketplace - Service Worker for PWA & Push Notifications
// Version 6 - Ultra-fast caching for instant loading
const CACHE_NAME = 'djassa-pwa-v6';
const DYNAMIC_CACHE = 'djassa-dynamic-v6';
const IMAGE_CACHE = 'djassa-images-v6';
const API_CACHE = 'djassa-api-v6';

// Maximum cache sizes
const MAX_DYNAMIC_CACHE = 150;
const MAX_IMAGE_CACHE = 300;
const MAX_API_CACHE = 100;

// Static assets to cache on install - Essential for WebAPK
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png'
];

// Install event - cache essential assets + prefetch JS chunks
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker v6 installing...');
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Prefetch critical routes in dynamic cache
      caches.open(DYNAMIC_CACHE).then((cache) => {
        // Cache common pages HTML for instant navigation
        return cache.addAll([
          '/marketplace',
          '/cart',
          '/categories'
        ]).catch(() => {
          // Ignore errors for SPA routes
          console.log('[SW] Some routes not available yet');
        });
      })
    ])
    .then(() => {
      console.log('[SW] Service Worker installed, skipping waiting');
      return self.skipWaiting();
    })
    .catch((error) => {
      console.error('[SW] Failed to cache static assets:', error);
    })
  );
});

// Activate event - clean up old caches aggressively
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker v6 activating...');
  const currentCaches = [CACHE_NAME, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !currentCaches.includes(name))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service Worker activated and controlling');
      // Notify all clients that SW is ready
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_READY' });
        });
      });
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
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return { strategy: 'network-only', cache: null };
  }
  
  // Skip cross-origin requests (except for CDN assets and Supabase storage)
  const isSupabaseStorage = url.hostname.includes('supabase.co') && url.pathname.includes('/storage/');
  const isCDN = url.hostname.includes('cdn.');
  
  if (!url.origin.includes(self.location.origin) && !isSupabaseStorage && !isCDN) {
    return { strategy: 'network-only', cache: null };
  }
  
  // Supabase storage images - cache very aggressively
  if (isSupabaseStorage) {
    return { strategy: 'cache-first', cache: IMAGE_CACHE };
  }
  
  // Skip Supabase API calls - always network (except storage)
  if (url.hostname.includes('supabase.co')) {
    return { strategy: 'network-only', cache: null };
  }
  
  // Image files - aggressive caching with long TTL
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i)) {
    return { strategy: 'cache-first', cache: IMAGE_CACHE };
  }
  
  // JS/CSS bundles - cache first (immutable with hash) - CRITICAL for instant nav
  if (url.pathname.match(/\.(js|css)$/) && (url.pathname.includes('assets/') || url.pathname.includes('chunks/'))) {
    return { strategy: 'cache-first', cache: DYNAMIC_CACHE };
  }
  
  // Vite deps - cache first for instant loading
  if (url.pathname.includes('/node_modules/.vite/')) {
    return { strategy: 'cache-first', cache: DYNAMIC_CACHE };
  }
  
  // Fonts - cache first
  if (url.pathname.match(/\.(woff|woff2|ttf|eot)$/)) {
    return { strategy: 'cache-first', cache: DYNAMIC_CACHE };
  }
  
  // HTML pages - stale-while-revalidate for instant loading
  if (request.headers.get('accept')?.includes('text/html')) {
    return { strategy: 'stale-while-revalidate', cache: DYNAMIC_CACHE };
  }
  
  // JSON data - network first with cache fallback
  if (url.pathname.endsWith('.json')) {
    return { strategy: 'network-first', cache: API_CACHE };
  }
  
  // Default to stale-while-revalidate for faster perceived performance
  return { strategy: 'stale-while-revalidate', cache: DYNAMIC_CACHE };
}

// Fetch event handler with optimized caching strategies
self.addEventListener('fetch', (event) => {
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
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(targetCache).then((cache) => {
                  cache.put(event.request, responseClone);
                  // Trim cache in background
                  if (targetCache === IMAGE_CACHE) {
                    trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE);
                  }
                });
              }
              return response;
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
              if (networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(targetCache).then((cache) => {
                  cache.put(event.request, responseClone);
                });
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);
          
          // Return cached immediately if available, otherwise wait for network
          return cachedResponse || fetchPromise;
        })
    );
    return;
  }
  
  // Network first strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && targetCache) {
          const responseClone = response.clone();
          caches.open(targetCache).then((cache) => {
            cache.put(event.request, responseClone);
            trimCache(targetCache, MAX_DYNAMIC_CACHE);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page for navigation requests
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
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

