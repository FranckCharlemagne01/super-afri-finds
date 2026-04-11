// Djassa Marketplace - Service Worker v12
// Full offline support + strategic caching for African markets (slow/unstable networks)
const SW_VERSION = 12;
const CACHE_NAME = 'djassa-pwa-v12';
const DYNAMIC_CACHE = 'djassa-dynamic-v12';
const IMAGE_CACHE = 'djassa-images-v12';
const API_CACHE = 'djassa-api-v12';
const OFFLINE_CACHE = 'djassa-offline-v12';

const MAX_DYNAMIC_CACHE = 150;
const MAX_IMAGE_CACHE = 300;
const MAX_API_CACHE = 100;

// Essential static assets cached on install
const STATIC_ASSETS = ['/manifest.json', '/favicon.png'];

// Offline fallback page (inline HTML)
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Djassa - Hors connexion</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:#FFF7ED;color:#1a1a1a;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.c{text-align:center;max-width:360px}
.icon{font-size:64px;margin-bottom:16px}
h1{font-size:22px;font-weight:700;color:#FF6B35;margin-bottom:8px}
p{font-size:15px;opacity:.7;line-height:1.5;margin-bottom:24px}
button{background:#FF6B35;color:#fff;border:none;padding:12px 32px;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;-webkit-tap-highlight-color:transparent}
button:active{transform:scale(.97)}
.cached{margin-top:24px;font-size:13px;opacity:.5}
</style>
</head>
<body>
<div class="c">
<div class="icon">📶</div>
<h1>Pas de connexion</h1>
<p>Vérifiez votre connexion internet et réessayez. Les produits déjà consultés sont disponibles hors-ligne.</p>
<button onclick="location.reload()">Réessayer</button>
<p class="cached">Djassa v${SW_VERSION}</p>
</div>
</body>
</html>`;

// Install
self.addEventListener('install', (event) => {
  console.log('[SW] v' + SW_VERSION + ' installing');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) =>
        Promise.allSettled(STATIC_ASSETS.map(a => cache.add(a).catch(() => null)))
      ),
      // Store offline fallback page
      caches.open(OFFLINE_CACHE).then((cache) =>
        cache.put(
          new Request('/_offline'),
          new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
        )
      ),
    ]).then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] v' + SW_VERSION + ' activating');
  const currentCaches = [CACHE_NAME, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE, OFFLINE_CACHE];
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter(n => n.startsWith('djassa-') && !currentCaches.includes(n)).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll())
      .then(clients => clients.forEach(c => c.postMessage({ type: 'SW_READY', version: SW_VERSION })))
  );
});

// LRU trim
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await Promise.all(keys.slice(0, keys.length - maxItems).map(k => cache.delete(k)));
  }
}

// Determine caching strategy
function getCacheConfig(request) {
  try {
    const url = new URL(request.url);

    if (request.method !== 'GET') return { strategy: 'network-only', cache: null };

    // Navigation: network-first with offline fallback
    if (request.mode === 'navigate') {
      return { strategy: 'network-first-navigate', cache: null };
    }

    // Supabase storage images — cache aggressively
    const isSupabaseStorage = url.hostname.includes('supabase.co') && url.pathname.includes('/storage/');
    if (isSupabaseStorage) return { strategy: 'cache-first', cache: IMAGE_CACHE };

    // Supabase API — always network
    if (url.hostname.includes('supabase.co')) return { strategy: 'network-only', cache: null };

    // Skip other cross-origin
    const isCDN = url.hostname.includes('cdn.');
    if (!url.origin.includes(self.location.origin) && !isCDN) {
      return { strategy: 'network-only', cache: null };
    }

    // Images
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i)) {
      return { strategy: 'cache-first', cache: IMAGE_CACHE };
    }

    // JS/CSS hashed bundles — network-first (avoid stale bundles)
    if (url.pathname.match(/\.(js|css)$/) && url.pathname.includes('assets/')) {
      return { strategy: 'network-first-fast', cache: DYNAMIC_CACHE };
    }

    // Fonts — cache first
    if (url.pathname.match(/\.(woff|woff2|ttf|eot)$/)) {
      return { strategy: 'cache-first', cache: DYNAMIC_CACHE };
    }

    // HTML — network only (don't cache stale pages)
    if (request.headers.get('accept')?.includes('text/html')) {
      return { strategy: 'network-first-fast', cache: null };
    }

    // JSON — stale-while-revalidate for offline access
    if (url.pathname.endsWith('.json')) {
      return { strategy: 'stale-while-revalidate', cache: API_CACHE };
    }

    return { strategy: 'network-first-fast', cache: DYNAMIC_CACHE };
  } catch {
    return { strategy: 'network-only', cache: null };
  }
}

// Fetch handler
self.addEventListener('fetch', (event) => {
  try {
    const { strategy, cache: targetCache } = getCacheConfig(event.request);

    if (strategy === 'network-only') return;

    // Navigation: try network, fallback to offline page
    if (strategy === 'network-first-navigate') {
      event.respondWith(
        fetch(event.request)
          .catch(() => caches.match('/_offline').then(r => r || new Response(OFFLINE_HTML, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          })))
      );
      return;
    }

    if (strategy === 'cache-first') {
      event.respondWith(
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(targetCache).then(c => {
                c.put(event.request, clone);
                if (targetCache === IMAGE_CACHE) trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE);
              }).catch(() => {});
            }
            return response;
          }).catch(() => new Response('', { status: 503 }));
        }).catch(() => fetch(event.request))
      );
      return;
    }

    if (strategy === 'network-first-fast') {
      event.respondWith(
        Promise.race([
          fetch(event.request).then((response) => {
            if (response && response.status === 200 && targetCache) {
              const clone = response.clone();
              caches.open(targetCache).then(c => c.put(event.request, clone)).catch(() => {});
            }
            return response;
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]).catch(() =>
          caches.match(event.request).then(cached => cached || fetch(event.request))
        )
      );
      return;
    }

    if (strategy === 'stale-while-revalidate') {
      event.respondWith(
        caches.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(targetCache).then(c => c.put(event.request, clone)).catch(() => {});
            }
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        }).catch(() => fetch(event.request))
      );
      return;
    }
  } catch {
    // Don't intercept on error
  }
});

// Push notifications
self.addEventListener('push', (event) => {
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
      data = { ...data, ...payload };
    }
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
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
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      return clients.openWindow?.(urlToOpen);
    })
  );
});

self.addEventListener('notificationclose', () => {});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
