// public/sw.js
const CACHE_NAME = 'lovas-zoltan-v1';
const STATIC_CACHE_NAME = 'static-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-v1';
const API_CACHE_NAME = 'api-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  // Add critical CSS and JS files here
];

// API routes to cache
const API_ROUTES = [
  '/api/posts',
  '/api/events',
  '/api/slides',
];

// Cache duration in milliseconds
const CACHE_DURATION = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000,    // 1 day
  API: 30 * 60 * 1000,             // 30 minutes
  IMAGES: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== API_CACHE_NAME
            ) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Static assets - Cache First strategy
    if (isStaticAsset(url)) {
      return await cacheFirst(request, STATIC_CACHE_NAME, CACHE_DURATION.STATIC);
    }
    
    // Images - Cache First with long duration
    if (isImage(url)) {
      return await cacheFirst(request, DYNAMIC_CACHE_NAME, CACHE_DURATION.IMAGES);
    }
    
    // API requests - Network First with cache fallback
    if (isAPIRequest(url)) {
      return await networkFirst(request, API_CACHE_NAME, CACHE_DURATION.API);
    }
    
    // HTML pages - Network First with cache fallback
    if (isHTMLRequest(request)) {
      return await networkFirst(request, DYNAMIC_CACHE_NAME, CACHE_DURATION.DYNAMIC);
    }
    
    // Everything else - Network only
    return await fetch(request);
    
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    
    // Return offline page for HTML requests
    if (isHTMLRequest(request)) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      const offlinePage = await cache.match('/offline.html');
      return offlinePage || new Response('Offline', { status: 503 });
    }
    
    // Return error response
    return new Response('Network error', { status: 503 });
  }
}

// Cache First strategy - try cache first, fallback to network
async function cacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Check if cached response is still valid
  if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
    console.log('[SW] Cache hit:', request.url);
    return cachedResponse;
  }
  
  try {
    console.log('[SW] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response before caching (response can only be consumed once)
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    // Return stale cache if network fails
    if (cachedResponse) {
      console.log('[SW] Network failed, returning stale cache:', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

// Network First strategy - try network first, fallback to cache
async function networkFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  
  try {
    console.log('[SW] Network first:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and cache the response
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      console.log('[SW] Network response cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Network failed, returning cache:', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

// Helper functions
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/favicon.ico'
  );
}

function isImage(url) {
  return (
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i) ||
    url.pathname.startsWith('/_next/image/')
  );
}

function isAPIRequest(url) {
  return (
    url.pathname.startsWith('/api/') &&
    !url.pathname.startsWith('/api/auth/') // Don't cache auth requests
  );
}

function isHTMLRequest(request) {
  return request.headers.get('accept')?.includes('text/html');
}

function isExpired(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return true;
  
  const date = new Date(dateHeader);
  const now = new Date();
  
  return (now.getTime() - date.getTime()) > maxAge;
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('[SW] Performing background sync');
  
  // Get failed requests from IndexedDB and retry them
  // This would require implementing an IndexedDB store for failed requests
  try {
    // Retry failed API requests
    // Implementation would depend on your specific needs
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    actions: data.actions || [],
    data: data.data || {},
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Handle notification actions
  if (event.action) {
    console.log('[SW] Notification action clicked:', event.action);
  }
  
  // Open the app
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({
        version: CACHE_NAME,
        caches: [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, API_CACHE_NAME],
      });
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload.cacheName).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'PRECACHE_URLS':
      precacheUrls(payload.urls).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Clear specific cache
async function clearCache(cacheName) {
  if (cacheName) {
    await caches.delete(cacheName);
    console.log('[SW] Cache cleared:', cacheName);
  } else {
    // Clear all caches
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] All caches cleared');
  }
}

// Precache URLs
async function precacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('[SW] Precached:', url);
      }
    } catch (error) {
      console.error('[SW] Failed to precache:', url, error);
    }
  }
}

// Periodic cache cleanup
setInterval(() => {
  cleanupExpiredCache();
}, 60 * 60 * 1000); // Run every hour

async function cleanupExpiredCache() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      
      if (response) {
        const maxAge = cacheName === STATIC_CACHE_NAME ? 
          CACHE_DURATION.STATIC : 
          CACHE_DURATION.DYNAMIC;
          
        if (isExpired(response, maxAge)) {
          await cache.delete(request);
          console.log('[SW] Expired cache entry removed:', request.url);
        }
      }
    }
  }
}

console.log('[SW] Service worker script loaded');