// src/lib/cache.ts
import { unstable_cache } from 'next/cache';

// Cache configuration
export const CACHE_TAGS = {
  POSTS: 'posts',
  EVENTS: 'events',
  MESSAGES: 'messages',
  SLIDES: 'slides',
  THEMES: 'themes',
  USER_SESSION: 'user-session',
} as const;

export const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600, // 1 hour
  STATIC: 86400, // 24 hours
} as const;

// Type for cache tags
export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

// Interface for cache configuration
interface CacheConfig {
  revalidate?: number;
  tags?: CacheTag[];
  keyParts?: (string | number)[];
}

// Client-side cache using Map (for SSR compatibility)
class ClientCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 100; // Maximum number of cached items

  set(key: string, data: any, ttl: number = CACHE_DURATIONS.MEDIUM * 1000): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats(): { size: number; maxSize: number; keys: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Clean expired items
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    return removed;
  }
}

// Singleton client cache instance
export const clientCache = new ClientCache();

// Auto cleanup expired items every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    clientCache.cleanup();
  }, 5 * 60 * 1000);
}

// Server-side cache using Next.js unstable_cache
export function createServerCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config: CacheConfig = {}
) {
  const { revalidate = CACHE_DURATIONS.MEDIUM, tags = [], keyParts = [] } = config;
  
  return unstable_cache(
    fn,
    keyParts.map(String),
    {
      revalidate,
      tags,
    }
  );
}

// Cache wrapper for API responses
export async function cacheApiResponse<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    clientTtl?: number;
    serverRevalidate?: number;
    tags?: CacheTag[];
    forceRefresh?: boolean;
  } = {}
): Promise<T> {
  const {
    clientTtl = CACHE_DURATIONS.MEDIUM * 1000,
    serverRevalidate = CACHE_DURATIONS.MEDIUM,
    tags = [],
    forceRefresh = false,
  } = options;

  // Check client-side cache first (only in browser)
  if (typeof window !== 'undefined' && !forceRefresh) {
    const cached = clientCache.get(key);
    if (cached) {
      return cached;
    }
  }

  // Create server-side cached function
  const cachedFetcher = createServerCache(
    async () => await fetcher(),
    {
      revalidate: serverRevalidate,
      tags,
      keyParts: [key],
    }
  );

  const data = await cachedFetcher();

  // Store in client cache (only in browser)
  if (typeof window !== 'undefined') {
    clientCache.set(key, data, clientTtl);
  }

  return data;
}

// React hook for cached data fetching
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    clientTtl?: number;
    serverRevalidate?: number;
    tags?: CacheTag[];
    enabled?: boolean;
  } = {}
) {
  const { enabled = true } = options;
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await cacheApiResponse(key, fetcher, options);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [key, enabled]);

  const invalidate = React.useCallback(() => {
    clientCache.delete(key);
    if (enabled) {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const result = await cacheApiResponse(key, fetcher, {
            ...options,
            forceRefresh: true,
          });
          setData(result);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [key, enabled]);

  return {
    data,
    isLoading,
    error,
    invalidate,
  };
}

// Cache invalidation helpers
export async function invalidateCache(tags: CacheTag[]) {
  if (typeof window !== 'undefined') {
    // Client-side: clear related cache entries
    const stats = clientCache.getStats();
    stats.keys.forEach(key => {
      // Simple tag matching - in production you might want more sophisticated logic
      if (tags.some(tag => key.includes(tag))) {
        clientCache.delete(key);
      }
    });
  }

  // Server-side: use Next.js revalidateTag
  if (typeof window === 'undefined') {
    const { revalidateTag } = await import('next/cache');
    tags.forEach(tag => revalidateTag(tag));
  }
}

// Preload data into cache
export async function preloadData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    clientTtl?: number;
    serverRevalidate?: number;
    tags?: CacheTag[];
  } = {}
): Promise<void> {
  try {
    await cacheApiResponse(key, fetcher, options);
  } catch (error) {
    // Silently fail preloading
    console.warn(`Failed to preload data for key: ${key}`, error);
  }
}

// Cache key generators
export const generateCacheKey = {
  posts: (filters?: { status?: string; page?: number; limit?: number; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.page) params.set('page', filters.page.toString());
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.search) params.set('search', filters.search);
    
    return `posts:${params.toString()}`;
  },

  events: (filters?: { page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', filters.page.toString());
    if (filters?.limit) params.set('limit', filters.limit.toString());
    
    return `events:${params.toString()}`;
  },

  post: (id: string) => `post:${id}`,
  event: (id: string) => `event:${id}`,
  slides: () => 'slides:all',
  themes: () => 'themes:all',
  userSession: (userId: string) => `session:${userId}`,
};

// Cache warming - preload critical data
export async function warmCache() {
  if (typeof window !== 'undefined') {
    // Warm client-side cache with critical data
    const criticalData = [
      { key: generateCacheKey.posts({ page: 1, limit: 10 }), tags: [CACHE_TAGS.POSTS] },
      { key: generateCacheKey.events({ page: 1, limit: 5 }), tags: [CACHE_TAGS.EVENTS] },
      { key: generateCacheKey.slides(), tags: [CACHE_TAGS.SLIDES] },
    ];

    for (const { key, tags } of criticalData) {
      // You would replace these with actual API calls
      try {
        await preloadData(
          key,
          async () => {
            const response = await fetch(`/api/${key.split(':')[0]}`);
            return response.json();
          },
          { tags, clientTtl: CACHE_DURATIONS.LONG * 1000 }
        );
      } catch (error) {
        console.warn(`Failed to warm cache for ${key}:`, error);
      }
    }
  }
}

// Cache metrics and monitoring
export function getCacheMetrics() {
  return {
    client: clientCache.getStats(),
    // Server-side cache metrics would need to be implemented separately
  };
}

// Cache configuration for different data types
export const cacheConfigs = {
  posts: {
    clientTtl: CACHE_DURATIONS.MEDIUM * 1000,
    serverRevalidate: CACHE_DURATIONS.MEDIUM,
    tags: [CACHE_TAGS.POSTS],
  },
  events: {
    clientTtl: CACHE_DURATIONS.LONG * 1000,
    serverRevalidate: CACHE_DURATIONS.LONG,
    tags: [CACHE_TAGS.EVENTS],
  },
  messages: {
    clientTtl: CACHE_DURATIONS.SHORT * 1000,
    serverRevalidate: CACHE_DURATIONS.SHORT,
    tags: [CACHE_TAGS.MESSAGES],
  },
  slides: {
    clientTtl: CACHE_DURATIONS.VERY_LONG * 1000,
    serverRevalidate: CACHE_DURATIONS.VERY_LONG,
    tags: [CACHE_TAGS.SLIDES],
  },
  themes: {
    clientTtl: CACHE_DURATIONS.STATIC * 1000,
    serverRevalidate: CACHE_DURATIONS.STATIC,
    tags: [CACHE_TAGS.THEMES],
  },
} as const;