// public/sw-video.js
// Service Worker for Video Caching and Offline Support

const CACHE_VERSION = '1.0.0';
const CACHE_NAME = `video-cache-v${CACHE_VERSION}`;
const VIDEO_CACHE_NAME = `videos-v${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `static-v${CACHE_VERSION}`;
const API_CACHE_NAME = `api-v${CACHE_VERSION}`;

const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB for videos
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const STATIC_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 1 day for static assets
const API_CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes for API responses

// File patterns to cache
const VIDEO_PATTERNS = [
  /\.(mp4|webm|mov|avi)$/i,
  /\/uploads\/.*\.(mp4|webm)$/i,
  /\/compressed\/.*\.(mp4|webm)$/i,
];

const STATIC_PATTERNS = [
  /\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/i,
  /\/_next\/static\//,
  /\/images\//,
];

const API_PATTERNS = [
  /\/api\/video\/analytics/,
  /\/api\/health/,
  /\/api\/ready/,
];

// Critical resources for offline functionality
const CRITICAL_RESOURCES = [
  '/',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/chunks/',
  '/images/logo.png',
  '/images/og-default.jpg',
];

// Pages to cache for offline access
const OFFLINE_PAGES = [
  '/',
  '/program',
  '/kapcsolat',
  '/esemenyek',
  '/hirek',
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  event.waitUntil(
    Promise.all([
      // Cache critical resources for offline functionality
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES.filter(Boolean));
      }),
      // Initialize video cache
      caches.open(VIDEO_CACHE_NAME).then((cache) => {
        console.log('[SW] Video cache initialized');
        return cache;
      }),
      // Initialize API cache
      caches.open(API_CACHE_NAME).then((cache) => {
        console.log('[SW] API cache initialized');
        return cache;
      }),
    ])
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches (cache invalidation)
      cleanupOldCaches(),
      // Clean up expired entries
      cleanupExpiredCaches(),
      // Manage cache sizes
      manageCacheSizes(),
      // Notify clients of activation
      notifyClientsOfActivation(),
    ])
  );
  self.clients.claim();
});

// Fetch event - Main caching logic
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Route requests to appropriate handlers
  if (isVideoRequest(request)) {
    event.respondWith(handleVideoRequest(request));
  } else if (isStaticRequest(request)) {
    event.respondWith(handleStaticRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  }
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'PRELOAD_VIDEO':
      handlePreloadVideo(data.url, data.priority);
      break;
    case 'CLEAR_VIDEO_CACHE':
      clearVideoCache();
      break;
    case 'CLEAR_ALL_CACHES':
      clearAllCaches();
      break;
    case 'GET_CACHE_STATUS':
      getCacheStatus().then((status) => {
        event.ports[0].postMessage(status);
      });
      break;
    case 'REMOVE_VIDEO':
      removeVideoFromCache(data.url);
      break;
    case 'INVALIDATE_CACHE':
      invalidateCache(data.pattern);
      break;
  }
});

// Request type checkers
function isVideoRequest(request) {
  const url = request.url;
  const acceptHeader = request.headers.get('accept') || '';
  
  return (
    VIDEO_PATTERNS.some(pattern => pattern.test(url)) ||
    acceptHeader.includes('video/') ||
    request.destination === 'video'
  );
}

function isStaticRequest(request) {
  const url = request.url;
  return STATIC_PATTERNS.some(pattern => pattern.test(url));
}

function isAPIRequest(request) {
  const url = request.url;
  return API_PATTERNS.some(pattern => pattern.test(url));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

// Handle video requests with caching strategy
async function handleVideoRequest(request) {
  const url = request.url;
  const cache = await caches.open(VIDEO_CACHE_NAME);
  
  try {
    // Check if video is in cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving video from cache:', url);
      
      // Update cache metadata
      await updateCacheMetadata(url);
      
      // Handle range requests for cached videos
      if (request.headers.has('range')) {
        return handleRangeRequest(request, cachedResponse);
      }
      
      return cachedResponse;
    }

    // Video not in cache, fetch from network
    console.log('[SW] Fetching video from network:', url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && networkResponse.status < 400) {
      // Clone response for caching
      const responseToCache = networkResponse.clone();
      
      // Cache the video
      await cacheVideo(cache, request, responseToCache);
      
      // Manage cache size after adding new video
      await manageCacheSize();
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Error handling video request:', error);
    
    // Try to serve from cache as fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving cached video as fallback:', url);
      return cachedResponse;
    }
    
    // Return offline response
    return new Response('Video unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Cache a video with metadata
async function cacheVideo(cache, request, response) {
  const url = request.url;
  const size = parseInt(response.headers.get('content-length') || '0');
  
  // Don't cache if video is too large
  if (size > MAX_CACHE_SIZE / 2) {
    console.log('[SW] Video too large to cache:', url, 'Size:', size);
    return;
  }
  
  // Store video in cache
  await cache.put(request, response);
  
  // Store metadata
  const metadata = {
    url,
    size,
    cachedAt: Date.now(),
    lastAccessed: Date.now(),
    accessCount: 1,
  };
  
  await storeVideoMetadata(metadata);
  console.log('[SW] Video cached:', url, 'Size:', size);
}

// Handle range requests for cached videos
async function handleRangeRequest(request, cachedResponse) {
  const rangeHeader = request.headers.get('range');
  const videoBuffer = await cachedResponse.arrayBuffer();
  
  if (!rangeHeader) {
    return cachedResponse;
  }
  
  const range = parseRangeHeader(rangeHeader, videoBuffer.byteLength);
  if (!range) {
    return new Response('Invalid range', { status: 416 });
  }
  
  const { start, end } = range;
  const chunk = videoBuffer.slice(start, end + 1);
  
  return new Response(chunk, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Range': `bytes ${start}-${end}/${videoBuffer.byteLength}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunk.byteLength.toString(),
      'Content-Type': cachedResponse.headers.get('content-type') || 'video/mp4',
    },
  });
}

// Parse Range header
function parseRangeHeader(rangeHeader, totalSize) {
  const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!rangeMatch) return null;
  
  const start = parseInt(rangeMatch[1]);
  const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : totalSize - 1;
  
  if (start >= totalSize || end >= totalSize || start > end) {
    return null;
  }
  
  return { start, end };
}

// Preload video
async function handlePreloadVideo(url, priority = 'low') {
  try {
    console.log('[SW] Preloading video:', url, 'Priority:', priority);
    
    const cache = await caches.open(VIDEO_CACHE_NAME);
    const cached = await cache.match(url);
    
    if (cached) {
      console.log('[SW] Video already cached:', url);
      return;
    }
    
    // Fetch and cache the video
    const response = await fetch(url);
    if (response.ok) {
      await cacheVideo(cache, new Request(url), response.clone());
      console.log('[SW] Video preloaded successfully:', url);
    }
    
  } catch (error) {
    console.error('[SW] Error preloading video:', url, error);
  }
}

// Manage cache size
async function manageCacheSize() {
  try {
    const cache = await caches.open(VIDEO_CACHE_NAME);
    const keys = await cache.keys();
    
    let totalSize = 0;
    const videoMetadata = [];
    
    // Calculate total cache size
    for (const request of keys) {
      const metadata = await getVideoMetadata(request.url);
      if (metadata) {
        totalSize += metadata.size;
        videoMetadata.push(metadata);
      }
    }
    
    console.log('[SW] Current cache size:', totalSize, 'bytes');
    
    // Remove oldest videos if cache is too large
    if (totalSize > MAX_CACHE_SIZE) {
      console.log('[SW] Cache size exceeded, cleaning up...');
      
      // Sort by last accessed time (oldest first)
      videoMetadata.sort((a, b) => a.lastAccessed - b.lastAccessed);
      
      let removedSize = 0;
      const targetSize = MAX_CACHE_SIZE * 0.8; // Remove until 80% of max size
      
      for (const metadata of videoMetadata) {
        if (totalSize - removedSize <= targetSize) break;
        
        await cache.delete(metadata.url);
        await removeVideoMetadata(metadata.url);
        removedSize += metadata.size;
        
        console.log('[SW] Removed cached video:', metadata.url, 'Size:', metadata.size);
      }
      
      console.log('[SW] Cache cleanup complete. Removed:', removedSize, 'bytes');
    }
    
  } catch (error) {
    console.error('[SW] Error managing cache size:', error);
  }
}

// Clean up expired videos
async function cleanupExpiredVideos() {
  try {
    const cache = await caches.open(VIDEO_CACHE_NAME);
    const keys = await cache.keys();
    const now = Date.now();
    
    for (const request of keys) {
      const metadata = await getVideoMetadata(request.url);
      if (metadata && (now - metadata.cachedAt) > CACHE_EXPIRY) {
        await cache.delete(request);
        await removeVideoMetadata(request.url);
        console.log('[SW] Removed expired video:', request.url);
      }
    }
    
  } catch (error) {
    console.error('[SW] Error cleaning expired videos:', error);
  }
}

// Store video metadata
async function storeVideoMetadata(metadata) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const metadataUrl = `metadata://${encodeURIComponent(metadata.url)}`;
    const response = new Response(JSON.stringify(metadata));
    await cache.put(metadataUrl, response);
  } catch (error) {
    console.error('[SW] Error storing metadata:', error);
  }
}

// Get video metadata
async function getVideoMetadata(url) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const metadataUrl = `metadata://${encodeURIComponent(url)}`;
    const response = await cache.match(metadataUrl);
    
    if (response) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('[SW] Error getting metadata:', error);
    return null;
  }
}

// Update cache metadata
async function updateCacheMetadata(url) {
  try {
    const metadata = await getVideoMetadata(url);
    if (metadata) {
      metadata.lastAccessed = Date.now();
      metadata.accessCount = (metadata.accessCount || 0) + 1;
      await storeVideoMetadata(metadata);
    }
  } catch (error) {
    console.error('[SW] Error updating metadata:', error);
  }
}

// Remove video metadata
async function removeVideoMetadata(url) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const metadataUrl = `metadata://${encodeURIComponent(url)}`;
    await cache.delete(metadataUrl);
  } catch (error) {
    console.error('[SW] Error removing metadata:', error);
  }
}

// Clear all video cache
async function clearVideoCache() {
  try {
    await caches.delete(VIDEO_CACHE_NAME);
    console.log('[SW] Video cache cleared');
  } catch (error) {
    console.error('[SW] Error clearing video cache:', error);
  }
}

// Remove specific video from cache
async function removeVideoFromCache(url) {
  try {
    const cache = await caches.open(VIDEO_CACHE_NAME);
    await cache.delete(url);
    await removeVideoMetadata(url);
    console.log('[SW] Removed video from cache:', url);
  } catch (error) {
    console.error('[SW] Error removing video from cache:', error);
  }
}

// Get cache status
async function getCacheStatus() {
  try {
    const cache = await caches.open(VIDEO_CACHE_NAME);
    const keys = await cache.keys();
    
    let totalSize = 0;
    let videoCount = 0;
    
    for (const request of keys) {
      const metadata = await getVideoMetadata(request.url);
      if (metadata) {
        totalSize += metadata.size;
        videoCount++;
      }
    }
    
    return {
      videoCount,
      totalSize,
      maxSize: MAX_CACHE_SIZE,
      usagePercentage: (totalSize / MAX_CACHE_SIZE) * 100,
    };
    
  } catch (error) {
    console.error('[SW] Error getting cache status:', error);
    return {
      videoCount: 0,
      totalSize: 0,
      maxSize: MAX_CACHE_SIZE,
      usagePercentage: 0,
    };
  }
}

// New handler functions for offline support

// Handle static asset requests (cache-first strategy)
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Check if cache is still fresh
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt && (Date.now() - parseInt(cachedAt)) < STATIC_CACHE_EXPIRY) {
        return cachedResponse;
      }
    }

    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      responseToCache.headers.append('sw-cached-at', Date.now().toString());
      await cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    // Return cached version if available
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback
    return new Response('Asset unavailable offline', { status: 503 });
  }
}

// Handle API requests (network-first with cache fallback)
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE_NAME);
      const responseToCache = networkResponse.clone();
      responseToCache.headers.append('sw-cached-at', Date.now().toString());
      await cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    // Return cached API response if available
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt && (Date.now() - parseInt(cachedAt)) < API_CACHE_EXPIRY) {
        return cachedResponse;
      }
    }

    // Return offline API response
    return new Response(JSON.stringify({
      error: 'API unavailable offline',
      offline: true,
      timestamp: Date.now()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle navigation requests (cache-first with network fallback)
async function handleNavigationRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const url = new URL(request.url);
    
    // Check if we have this page cached
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try to fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the page
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    // Return offline page
    const cache = await caches.open(STATIC_CACHE_NAME);
    
    // Try to return cached version of the requested page
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return cached home page as fallback
    const homePage = await cache.match('/');
    if (homePage) {
      return homePage;
    }

    // Return basic offline page
    return new Response(`
      <!DOCTYPE html>
      <html lang="hu">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Lovas Zoltán György</title>
        <style>
          body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
          .offline { color: #666; margin-top: 2rem; }
        </style>
      </head>
      <body>
        <h1>Offline mód</h1>
        <p>Jelenleg nincs internetkapcsolat.</p>
        <div class="offline">
          <p>A webhely offline módban működik korlátozott funkcionalitással.</p>
          <button onclick="window.location.reload()">Újrapróbálkozás</button>
        </div>
      </body>
      </html>
    `, {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Cache invalidation and cleanup functions
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [CACHE_NAME, VIDEO_CACHE_NAME, STATIC_CACHE_NAME, API_CACHE_NAME];
  
  return Promise.all(
    cacheNames
      .filter(cacheName => !currentCaches.includes(cacheName))
      .map(cacheName => {
        console.log('[SW] Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      })
  );
}

async function cleanupExpiredCaches() {
  const now = Date.now();
  
  // Clean expired static cache
  const staticCache = await caches.open(STATIC_CACHE_NAME);
  const staticKeys = await staticCache.keys();
  
  for (const request of staticKeys) {
    const response = await staticCache.match(request);
    if (response) {
      const cachedAt = response.headers.get('sw-cached-at');
      if (cachedAt && (now - parseInt(cachedAt)) > STATIC_CACHE_EXPIRY) {
        await staticCache.delete(request);
      }
    }
  }
  
  // Clean expired API cache
  const apiCache = await caches.open(API_CACHE_NAME);
  const apiKeys = await apiCache.keys();
  
  for (const request of apiKeys) {
    const response = await apiCache.match(request);
    if (response) {
      const cachedAt = response.headers.get('sw-cached-at');
      if (cachedAt && (now - parseInt(cachedAt)) > API_CACHE_EXPIRY) {
        await apiCache.delete(request);
      }
    }
  }
  
  // Clean expired video cache
  await cleanupExpiredVideos();
}

async function manageCacheSizes() {
  await manageCacheSize(); // Existing video cache management
  
  // Manage static cache size (limit to 50MB)
  const staticCache = await caches.open(STATIC_CACHE_NAME);
  const staticKeys = await staticCache.keys();
  
  if (staticKeys.length > 100) { // Simple count-based limit
    const oldestKeys = staticKeys.slice(0, staticKeys.length - 100);
    await Promise.all(oldestKeys.map(key => staticCache.delete(key)));
  }
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
}

async function invalidateCache(pattern) {
  const cacheNames = await caches.keys();
  const regex = new RegExp(pattern);
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const request of keys) {
      if (regex.test(request.url)) {
        await cache.delete(request);
        console.log('[SW] Invalidated cache entry:', request.url);
      }
    }
  }
}

async function notifyClientsOfActivation() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SW_ACTIVATED',
      version: CACHE_VERSION
    });
  });
}