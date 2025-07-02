// src/lib/service-worker-manager.ts
"use client";

interface CacheStatus {
  videoCount: number;
  totalSize: number;
  maxSize: number;
  usagePercentage: number;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = false;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
  }

  /**
   * Initialize and register the video service worker
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      // Register the video service worker
      this.registration = await navigator.serviceWorker.register('/sw-video.js', {
        scope: '/',
      });

      console.log('Video Service Worker registered successfully');

      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New Video Service Worker available');
              this.notifyUpdate();
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Preload a video for caching
   */
  async preloadVideo(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    if (!this.registration || !this.registration.active) {
      console.warn('Service Worker not active, cannot preload video');
      return;
    }

    try {
      this.registration.active.postMessage({
        type: 'PRELOAD_VIDEO',
        data: { url, priority },
      });

      console.log(`Video preload requested: ${url} (priority: ${priority})`);
    } catch (error) {
      console.error('Failed to request video preload:', error);
    }
  }

  /**
   * Clear all video cache
   */
  async clearVideoCache(): Promise<void> {
    if (!this.registration || !this.registration.active) {
      console.warn('Service Worker not active, cannot clear cache');
      return;
    }

    try {
      this.registration.active.postMessage({
        type: 'CLEAR_VIDEO_CACHE',
      });

      console.log('Video cache clear requested');
    } catch (error) {
      console.error('Failed to clear video cache:', error);
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    if (!this.registration || !this.registration.active) {
      console.warn('Service Worker not active, cannot clear all caches');
      return;
    }

    try {
      this.registration.active.postMessage({
        type: 'CLEAR_ALL_CACHES',
      });

      console.log('All caches clear requested');
    } catch (error) {
      console.error('Failed to clear all caches:', error);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateCache(pattern: string): Promise<void> {
    if (!this.registration || !this.registration.active) {
      console.warn('Service Worker not active, cannot invalidate cache');
      return;
    }

    try {
      this.registration.active.postMessage({
        type: 'INVALIDATE_CACHE',
        data: { pattern },
      });

      console.log(`Cache invalidation requested for pattern: ${pattern}`);
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }
  }

  /**
   * Remove specific video from cache
   */
  async removeVideo(url: string): Promise<void> {
    if (!this.registration || !this.registration.active) {
      console.warn('Service Worker not active, cannot remove video');
      return;
    }

    try {
      this.registration.active.postMessage({
        type: 'REMOVE_VIDEO',
        data: { url },
      });

      console.log(`Video removal requested: ${url}`);
    } catch (error) {
      console.error('Failed to remove video from cache:', error);
    }
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<CacheStatus> {
    if (!this.registration || !this.registration.active) {
      console.warn('Service Worker not active, cannot get cache status');
      return {
        videoCount: 0,
        totalSize: 0,
        maxSize: 0,
        usagePercentage: 0,
      };
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      try {
        this.registration!.active!.postMessage(
          { type: 'GET_CACHE_STATUS' },
          [messageChannel.port2]
        );

        // Timeout after 5 seconds
        setTimeout(() => {
          reject(new Error('Cache status request timeout'));
        }, 5000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Check if video is likely cached
   */
  async isVideoCached(url: string): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      const cache = await caches.open('videos-v1');
      const response = await cache.match(url);
      return !!response;
    } catch (error) {
      console.warn('Failed to check video cache status:', error);
      return false;
    }
  }

  /**
   * Preload multiple videos with intelligent prioritization
   */
  async preloadVideos(videos: Array<{ url: string; priority?: 'high' | 'medium' | 'low' }>): Promise<void> {
    // Sort by priority
    const sortedVideos = videos.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      return bPriority - aPriority;
    });

    // Preload in sequence with delays to avoid overwhelming the network
    for (const video of sortedVideos) {
      await this.preloadVideo(video.url, video.priority);
      
      // Small delay between preloads
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      console.warn('No service worker registration to update');
      return;
    }

    try {
      await this.registration.update();
      console.log('Service Worker update check completed');
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  /**
   * Get cache efficiency metrics
   */
  async getCacheMetrics(): Promise<{
    hitRate: number;
    missRate: number;
    totalRequests: number;
    cachedRequests: number;
  }> {
    // This would typically be tracked in the service worker
    // For now, return default values
    return {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      cachedRequests: 0,
    };
  }

  /**
   * Monitor cache performance
   */
  startCacheMonitoring(): void {
    if (!this.isSupported) return;

    // Monitor cache performance every 30 seconds
    setInterval(async () => {
      try {
        const status = await this.getCacheStatus();
        
        // Emit cache status event
        const event = new CustomEvent('videoCacheStatus', {
          detail: status,
        });
        window.dispatchEvent(event);

        // Log warnings if cache is getting full
        if (status.usagePercentage > 80) {
          console.warn('Video cache is getting full:', status.usagePercentage + '%');
        }
      } catch (error) {
        console.error('Cache monitoring error:', error);
      }
    }, 30000);
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'VIDEO_CACHED':
        console.log('Video cached:', data.url);
        this.emitVideoCachedEvent(data.url);
        break;
      case 'VIDEO_CACHE_ERROR':
        console.error('Video cache error:', data.error);
        this.emitVideoCacheErrorEvent(data.url, data.error);
        break;
      case 'CACHE_FULL':
        console.warn('Video cache is full');
        this.emitCacheFullEvent();
        break;
    }
  }

  private notifyUpdate(): void {
    const event = new CustomEvent('serviceWorkerUpdate', {
      detail: { hasUpdate: true },
    });
    window.dispatchEvent(event);
  }

  private emitVideoCachedEvent(url: string): void {
    const event = new CustomEvent('videoCached', {
      detail: { url },
    });
    window.dispatchEvent(event);
  }

  private emitVideoCacheErrorEvent(url: string, error: string): void {
    const event = new CustomEvent('videoCacheError', {
      detail: { url, error },
    });
    window.dispatchEvent(event);
  }

  private emitCacheFullEvent(): void {
    const event = new CustomEvent('videoCacheFull');
    window.dispatchEvent(event);
  }
}

// Global instance
let serviceWorkerManager: ServiceWorkerManager | null = null;

export const getServiceWorkerManager = (): ServiceWorkerManager => {
  if (!serviceWorkerManager) {
    serviceWorkerManager = new ServiceWorkerManager();
  }
  return serviceWorkerManager;
};

export type { CacheStatus };
export { ServiceWorkerManager };