// src/lib/prefetch.tsx
"use client";

import React from 'react';

interface PrefetchOptions {
  priority?: 'high' | 'low';
  as?: 'script' | 'style' | 'image' | 'font' | 'fetch' | 'document';
  crossOrigin?: 'anonymous' | 'use-credentials';
  media?: string;
  type?: string;
}

interface PrefetchQueue {
  url: string;
  options: PrefetchOptions;
  priority: number;
}

class ResourcePrefetcher {
  private prefetchedUrls = new Set<string>();
  private prefetchQueue: PrefetchQueue[] = [];
  private isProcessing = false;
  private observer?: IntersectionObserver;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeIntersectionObserver();
      this.startQueueProcessor();
    }
  }

  // Prefetch a resource immediately
  prefetch(url: string, options: PrefetchOptions = {}): void {
    if (this.prefetchedUrls.has(url) || !this.shouldPrefetch()) {
      return;
    }

    this.prefetchedUrls.add(url);

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;

    if (options.as) link.as = options.as;
    if (options.crossOrigin) link.crossOrigin = options.crossOrigin;
    if (options.media) link.media = options.media;
    if (options.type) link.type = options.type;

    document.head.appendChild(link);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Prefetch] ${url} (${options.as || 'fetch'})`);
    }
  }

  // Preload a critical resource
  preload(url: string, options: PrefetchOptions = {}): void {
    if (this.prefetchedUrls.has(url)) {
      return;
    }

    this.prefetchedUrls.add(url);

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;

    if (options.as) link.as = options.as;
    if (options.crossOrigin) link.crossOrigin = options.crossOrigin;
    if (options.type) link.type = options.type;

    document.head.appendChild(link);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Preload] ${url} (${options.as || 'fetch'})`);
    }
  }

  // Add to prefetch queue with priority
  queuePrefetch(url: string, options: PrefetchOptions = {}): void {
    if (this.prefetchedUrls.has(url)) {
      return;
    }

    const priority = options.priority === 'high' ? 1 : 2;
    this.prefetchQueue.push({ url, options, priority });
    this.prefetchQueue.sort((a, b) => a.priority - b.priority);
  }

  // Process prefetch queue gradually
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.isProcessing && this.prefetchQueue.length > 0 && this.shouldPrefetch()) {
        this.isProcessing = true;
        const item = this.prefetchQueue.shift();
        if (item) {
          this.prefetch(item.url, item.options);
        }
        this.isProcessing = false;
      }
    }, 1000); // Process one item per second to avoid overwhelming the network
  }

  // Check if we should prefetch based on connection and user preferences
  private shouldPrefetch(): boolean {
    if (typeof navigator === 'undefined') return false;

    // Check for data saver mode
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        // Don't prefetch on slow connections
        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          return false;
        }
        
        // Don't prefetch if user has data saver enabled
        if (connection.saveData) {
          return false;
        }
        
        // Don't prefetch on very slow connections
        if (connection.downlink < 1.5) {
          return false;
        }
      }
    }

    // Check for battery level (if available)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2 && !battery.charging) {
          return false; // Don't prefetch on low battery
        }
      });
    }

    return true;
  }

  // Initialize intersection observer for hover prefetching
  private initializeIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const href = element.getAttribute('data-prefetch');
            if (href) {
              this.queuePrefetch(href, { priority: 'low' });
            }
          }
        });
      },
      { rootMargin: '200px' } // Start prefetching when element is 200px from viewport
    );
  }

  // Observe elements for prefetching
  observeElement(element: HTMLElement, url: string): void {
    if (this.observer) {
      element.setAttribute('data-prefetch', url);
      this.observer.observe(element);
    }
  }

  // Preload critical resources for the current page
  preloadCriticalResources(): void {
    // Preload critical CSS (if using external CSS)
    const criticalCSS = [
      // Add critical CSS URLs here
    ];

    criticalCSS.forEach(url => {
      this.preload(url, { as: 'style' });
    });

    // Preload critical fonts
    const criticalFonts = [
      // Add critical font URLs here
    ];

    criticalFonts.forEach(url => {
      this.preload(url, { as: 'font', crossOrigin: 'anonymous' });
    });

    // Preload hero images
    const heroImages = document.querySelectorAll('[data-hero-image]');
    heroImages.forEach((img) => {
      const src = img.getAttribute('data-hero-image');
      if (src) {
        this.preload(src, { as: 'image' });
      }
    });
  }

  // Prefetch resources for likely next navigation
  prefetchNextPage(currentPath: string): void {
    const navigationPatterns = {
      '/': ['/events', '/news', '/contact'], // From home page
      '/events': ['/events/[id]', '/contact'], // From events page
      '/news': ['/news/[id]', '/contact'], // From news page
      '/admin': ['/admin/posts', '/admin/events', '/admin/messages'], // Admin navigation
    };

    const nextPages = navigationPatterns[currentPath as keyof typeof navigationPatterns];
    if (nextPages) {
      nextPages.forEach(page => {
        this.queuePrefetch(page, { priority: 'low' });
      });
    }
  }

  // Clean up
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.prefetchQueue = [];
    this.prefetchedUrls.clear();
  }
}

// Singleton instance
export const resourcePrefetcher = new ResourcePrefetcher();

// React hook for hover prefetching
export function useHoverPrefetch(url: string, enabled = true) {
  const elementRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const element = elementRef.current;
    let prefetchTimer: NodeJS.Timeout;

    const handleMouseEnter = () => {
      // Delay prefetch by 100ms to avoid prefetching on quick mouse movements
      prefetchTimer = setTimeout(() => {
        resourcePrefetcher.prefetch(url, { priority: 'high' });
      }, 100);
    };

    const handleMouseLeave = () => {
      if (prefetchTimer) {
        clearTimeout(prefetchTimer);
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (prefetchTimer) {
        clearTimeout(prefetchTimer);
      }
    };
  }, [url, enabled]);

  return elementRef;
}

// React hook for viewport prefetching
export function useViewportPrefetch(url: string, options: PrefetchOptions = {}) {
  const elementRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!elementRef.current) return;

    resourcePrefetcher.observeElement(elementRef.current, url);

    return () => {
      // Cleanup is handled by the ResourcePrefetcher
    };
  }, [url]);

  return elementRef;
}

// Route-based prefetching
export function usePrefetchRoute(route: string, condition: boolean = true) {
  React.useEffect(() => {
    if (condition && typeof window !== 'undefined') {
      // Prefetch the route's JavaScript bundle
      const routeChunk = `/_next/static/chunks/pages${route}.js`;
      resourcePrefetcher.queuePrefetch(routeChunk, { as: 'script', priority: 'low' });

      // Also prefetch any route-specific CSS
      const routeCSS = `/_next/static/css/pages${route}.css`;
      resourcePrefetcher.queuePrefetch(routeCSS, { as: 'style', priority: 'low' });
    }
  }, [route, condition]);
}

// Component for prefetching
interface PrefetchProps {
  href: string;
  children: React.ReactNode;
  strategy?: 'hover' | 'viewport' | 'immediate';
  options?: PrefetchOptions;
}

export function PrefetchLink({ 
  href, 
  children, 
  strategy = 'hover',
  options = {} 
}: PrefetchProps) {
  const hoverRef = useHoverPrefetch(href, strategy === 'hover');
  const viewportRef = useViewportPrefetch(href, options);
  
  React.useEffect(() => {
    if (strategy === 'immediate') {
      resourcePrefetcher.prefetch(href, options);
    }
  }, [href, strategy, options]);

  const ref = strategy === 'hover' ? hoverRef : viewportRef;

  return (
    <div ref={ref}>
      {children}
    </div>
  );
}

// Prefetch images in a gallery
export function usePrefetchImages(imageUrls: string[], enabled = true) {
  React.useEffect(() => {
    if (!enabled) return;

    // Prefetch images with a delay to avoid overwhelming the network
    imageUrls.forEach((url, index) => {
      setTimeout(() => {
        resourcePrefetcher.queuePrefetch(url, { as: 'image', priority: 'low' });
      }, index * 500); // 500ms delay between each image
    });
  }, [imageUrls, enabled]);
}

// Critical resource preloader component
export function CriticalResourcePreloader() {
  React.useEffect(() => {
    resourcePrefetcher.preloadCriticalResources();
    
    // Prefetch likely next pages based on current route
    const currentPath = window.location.pathname;
    resourcePrefetcher.prefetchNextPage(currentPath);
  }, []);

  return null; // This component doesn't render anything
}

// Export prefetcher for direct usage
export { resourcePrefetcher };