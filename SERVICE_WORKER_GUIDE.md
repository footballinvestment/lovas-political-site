# Service Worker & Offline Support Guide

Ez a dokumentum leírja a projektben implementált Service Worker rendszert és offline támogatást.

## 🚀 Funkciók

### ✅ Implementált képességek:
- **🎬 Video caching** - Intelligens videó cache 100MB limittel
- **📱 Offline support** - Teljes offline működés
- **🔄 Cache invalidation** - Automatikus cache tisztítás
- **📢 Update notifications** - Új verzió értesítések
- **📊 Cache analytics** - Részletes cache metrikák
- **🎯 PWA support** - Progressive Web App funkcionalitás

## 🔧 Beállítás és konfiguráció

### Environment változók

```bash
# Service Worker engedélyezése development módban
NEXT_PUBLIC_SW_DEV=false  # true = engedélyezve development-ben

# Video optimalizálás
NEXT_PUBLIC_VIDEO_QUALITY_DEFAULT=medium
NEXT_PUBLIC_VIDEO_PRELOAD=true

# Analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_CACHE_ANALYTICS=true
```

### Automatikus regisztráció

A Service Worker automatikusan regisztrálódik:
- **Production**: Mindig aktív
- **Development**: Csak ha `NEXT_PUBLIC_SW_DEV=true`

## 📋 Cache stratégiák

### 1. **Video Cache** (Cache-First)
```javascript
// 100MB limit, 7 napos lejárat
Cache Name: videos-v1.0.0
Strategy: Cache-first with network fallback
Expiry: 7 days
Max Size: 100MB
```

### 2. **Static Assets** (Cache-First)
```javascript
// JS, CSS, képek, fontok
Cache Name: static-v1.0.0
Strategy: Cache-first with freshness check
Expiry: 1 day
Files: .js, .css, .woff2, .png, .jpg, .svg
```

### 3. **API Responses** (Network-First)
```javascript
// API válaszok cache-elése
Cache Name: api-v1.0.0
Strategy: Network-first with cache fallback
Expiry: 15 minutes
Endpoints: /api/video/analytics, /api/health
```

### 4. **Navigation** (Cache-First)
```javascript
// Oldalak offline elérése
Cache Name: static-v1.0.0
Strategy: Cache-first with network fallback
Fallback: Offline page vagy főoldal
```

## 🎬 Video Cache Management

### Automatikus funkciók
```typescript
// Intelligens video preloading
await serviceWorker.preloadVideo('/video.mp4', 'high');

// Cache méret management
await serviceWorker.getCacheStatus();
// Returns: { videoCount, totalSize, usagePercentage }

// Video eltávolítás
await serviceWorker.removeVideo('/video.mp4');
```

### Manual cache operations
```typescript
// Teljes video cache törlése
await serviceWorker.clearVideoCache();

// Összes cache törlése
await serviceWorker.clearAllCaches();

// Pattern-based invalidation
await serviceWorker.invalidateCache('.*\.mp4$');
```

## 📢 Update Management

### Automatikus update detection
```typescript
// Új Service Worker verzió detected
window.addEventListener('serviceWorkerUpdate', (event) => {
  // Update notification megjelenítése
  showUpdateNotification();
});
```

### Manual update trigger
```typescript
// Force update alkalmazása
const handleUpdate = async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload(); // Reload after activation
  }
};
```

## 💾 Offline Support

### Cached pages (offline elérhető)
- `/` - Főoldal
- `/program` - Politikai program
- `/kapcsolat` - Kapcsolat
- `/esemenyek` - Események
- `/hirek` - Hírek

### Offline fallback
```html
<!-- Automatikus offline page -->
<html>
  <body>
    <h1>Offline mód</h1>
    <p>Jelenleg nincs internetkapcsolat.</p>
    <button onclick="window.location.reload()">Újrapróbálkozás</button>
  </body>
</html>
```

### Network detection
```typescript
// Online/offline állapot monitoring
window.addEventListener('online', () => {
  // Kapcsolat visszaállt
});

window.addEventListener('offline', () => {
  // Offline mód aktiválva
});
```

## 📊 Monitoring és Analytics

### Cache metrics
```typescript
const status = await serviceWorker.getCacheStatus();
console.log({
  videos: status.videoCount,
  size: `${status.totalSize / 1024 / 1024}MB`,
  usage: `${status.usagePercentage}%`
});
```

### Event monitoring
```typescript
// Cache events
window.addEventListener('videoCached', (event) => {
  console.log('Video cached:', event.detail.url);
});

window.addEventListener('videoCacheError', (event) => {
  console.error('Cache error:', event.detail);
});

window.addEventListener('videoCacheFull', () => {
  console.warn('Video cache is full');
});
```

## 🔄 Cache Invalidation

### Automatic cleanup
- **Daily**: Expired entries törlése
- **On activate**: Old cache versions törlése
- **Size limit**: LRU eviction ha méret túllépés

### Manual invalidation
```typescript
// Specific pattern invalidation
await serviceWorker.invalidateCache('video.*compressed');

// Full cache reset
await serviceWorker.clearAllCaches();

// Version-based invalidation (automatic on update)
// Cache version: 1.0.0 -> 1.0.1 triggers cleanup
```

## 🎯 PWA Features

### Manifest.json
```json
{
  "name": "Lovas Zoltán György",
  "short_name": "Lovas Zoltán",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb"
}
```

### Install prompts
```typescript
// PWA install event
window.addEventListener('beforeinstallprompt', (event) => {
  // Show custom install button
  showInstallButton(event);
});
```

### App shortcuts
- **Program** - `/program`
- **Események** - `/esemenyek`  
- **Kapcsolat** - `/kapcsolat`

## 🚨 Error Handling

### Service Worker errors
```typescript
// Registration errors
if (!('serviceWorker' in navigator)) {
  console.warn('Service Worker not supported');
}

// Update errors
window.addEventListener('serviceWorkerError', (event) => {
  console.error('SW Error:', event.detail);
});
```

### Cache errors
```typescript
// Graceful degradation
if (!cachedResponse) {
  // Fallback to network or offline page
  return networkFallback();
}
```

## 🔧 Development

### Testing Service Worker
```bash
# Enable in development
NEXT_PUBLIC_SW_DEV=true npm run dev

# Check registration
console.log('SW registered:', !!navigator.serviceWorker.controller);

# Monitor cache
await serviceWorker.getCacheStatus();
```

### Debug console
```javascript
// Service Worker debug info (development mode)
// Bottom-left corner shows: SW: ✅ or ❌
```

### Cache inspection
```bash
# Browser DevTools
1. Application tab
2. Storage > Cache Storage
3. Inspect: videos-v1.0.0, static-v1.0.0, api-v1.0.0
```

## 🚀 Production Deployment

### Build process
```bash
# Automatic Service Worker activation
npm run build  # SW enabled in production

# Manual cache preload
npm run dev
# Visit pages to populate cache
```

### Verification checklist
- [ ] Service Worker registered (`navigator.serviceWorker.controller`)
- [ ] Manifest.json accessible (`/manifest.json`)
- [ ] Video cache working (check DevTools)
- [ ] Offline pages accessible (disable network)
- [ ] Update notifications working (deploy new version)

### Performance monitoring
```typescript
// Production metrics
const metrics = await serviceWorker.getCacheMetrics();
console.log({
  hitRate: metrics.hitRate,
  missRate: metrics.missRate,
  totalRequests: metrics.totalRequests
});
```

## 📝 Troubleshooting

### Common issues

**Service Worker nem regisztrálódik**
```bash
# Check environment
console.log(process.env.NODE_ENV);
console.log(process.env.NEXT_PUBLIC_SW_DEV);
```

**Cache nem működik**
```bash
# Clear all caches
await serviceWorker.clearAllCaches();
# Reload page
window.location.reload();
```

**Update notification nem jelenik meg**
```bash
# Force SW update check
const registration = await navigator.serviceWorker.getRegistration();
await registration.update();
```

**Offline mode problémák**
```bash
# Check cached pages
const cache = await caches.open('static-v1.0.0');
const keys = await cache.keys();
console.log('Cached pages:', keys.map(k => k.url));
```

### Debug commands
```typescript
// Service Worker status
console.log('SW Controller:', navigator.serviceWorker.controller);
console.log('SW Registration:', await navigator.serviceWorker.getRegistration());

// Cache inspection
const cacheNames = await caches.keys();
console.log('Available caches:', cacheNames);
```

## 🔮 Future Enhancements

### Tervezett fejlesztések
- [ ] **Background sync** - Offline actions sync when online
- [ ] **Push notifications** - Update alerts és hírek
- [ ] **Advanced analytics** - User behavior tracking
- [ ] **Smart preloading** - ML-based content prediction

### API extensions
- [ ] **Cache prioritization** - Important content first
- [ ] **Bandwidth adaptation** - Network-aware caching
- [ ] **User preferences** - Custom cache settings
- [ ] **A/B testing** - Cache strategy optimization

---

*A Service Worker rendszer production-ready és minden modern böngészőben működik. Teljes offline támogatással és intelligens cache management-tel.*