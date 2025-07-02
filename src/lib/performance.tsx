// src/lib/performance.ts
"use client";

import React from 'react';

// Performance monitoring and optimization utilities

export interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  renderTime?: number;
  componentCount?: number;
  bundleSize?: number;
}

export interface ComponentMetrics {
  name: string;
  renderTime: number;
  renderCount: number;
  lastRender: number;
  props?: any;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private componentMetrics = new Map<string, ComponentMetrics>();
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    if (this.isInitialized) return;

    try {
      // Core Web Vitals monitoring
      this.observeLCP();
      this.observeFID();
      this.observeCLS();
      this.observeFCP();
      this.observeTTFB();

      // Navigation timing
      this.observeNavigation();

      this.isInitialized = true;
    } catch (error) {
      console.warn('Performance monitoring initialization failed:', error);
    }
  }

  private observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.metrics.lcp = lastEntry.startTime;
        this.reportMetric('LCP', lastEntry.startTime);
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(observer);
      } catch (e) {
        // Fallback for browsers that don't support LCP
        console.warn('LCP monitoring not supported');
      }
    }
  }

  private observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
          this.reportMetric('FID', this.metrics.fid);
        });
      });

      try {
        observer.observe({ entryTypes: ['first-input'] });
        this.observers.push(observer);
      } catch (e) {
        console.warn('FID monitoring not supported');
      }
    }
  }

  private observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
            this.reportMetric('CLS', clsValue);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(observer);
      } catch (e) {
        console.warn('CLS monitoring not supported');
      }
    }
  }

  private observeFCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            this.reportMetric('FCP', entry.startTime);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['paint'] });
        this.observers.push(observer);
      } catch (e) {
        console.warn('FCP monitoring not supported');
      }
    }
  }

  private observeTTFB() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.fetchStart;
        this.reportMetric('TTFB', this.metrics.ttfb);
      }
    }
  }

  private observeNavigation() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const renderTime = entry.domContentLoadedEventEnd - entry.fetchStart;
          this.metrics.renderTime = renderTime;
          this.reportMetric('Render Time', renderTime);
        });
      });

      try {
        observer.observe({ entryTypes: ['navigation'] });
        this.observers.push(observer);
      } catch (e) {
        console.warn('Navigation timing not supported');
      }
    }
  }

  // Component-level performance tracking
  startComponentRender(componentName: string, props?: any): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      const existing = this.componentMetrics.get(componentName);
      this.componentMetrics.set(componentName, {
        name: componentName,
        renderTime,
        renderCount: existing ? existing.renderCount + 1 : 1,
        lastRender: Date.now(),
        props,
      });

      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render (>16ms)`);
      }
    };
  }

  // Memory usage monitoring
  getMemoryUsage(): any {
    if ('memory' in performance) {
      return {
        usedJSMemory: (performance as any).memory.usedJSMemory,
        totalJSMemory: (performance as any).memory.totalJSMemory,
        jsMemoryLimit: (performance as any).memory.jsMemoryLimit,
      };
    }
    return null;
  }

  // Bundle size estimation
  getBundleSize(): Promise<number> {
    return new Promise((resolve) => {
      if ('navigator' in window && 'connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.downlink) {
          // Estimate based on download time and connection speed
          const estimatedSize = this.metrics.renderTime! * connection.downlink * 1000;
          resolve(estimatedSize);
          return;
        }
      }
      
      // Fallback: estimate based on script tags
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      let totalSize = 0;
      
      scripts.forEach(script => {
        const src = (script as HTMLScriptElement).src;
        if (src.includes('/_next/')) {
          // Estimate Next.js bundle size
          totalSize += 200000; // ~200KB estimate per chunk
        }
      });
      
      resolve(totalSize);
    });
  }

  // Get all metrics
  getMetrics(): PerformanceMetrics & { components: ComponentMetrics[]; memory?: any } {
    return {
      ...this.metrics,
      components: Array.from(this.componentMetrics.values()),
      memory: this.getMemoryUsage(),
    };
  }

  // Performance score calculation
  calculateScore(): { score: number; grade: string; recommendations: string[] } {
    const recommendations: string[] = [];
    let score = 100;

    // LCP scoring (Core Web Vital)
    if (this.metrics.lcp) {
      if (this.metrics.lcp > 4000) {
        score -= 30;
        recommendations.push('Optimize Largest Contentful Paint (LCP) - consider image optimization and lazy loading');
      } else if (this.metrics.lcp > 2500) {
        score -= 15;
        recommendations.push('LCP could be improved - optimize critical resources');
      }
    }

    // FID scoring (Core Web Vital)
    if (this.metrics.fid) {
      if (this.metrics.fid > 300) {
        score -= 25;
        recommendations.push('Reduce First Input Delay (FID) - optimize JavaScript execution');
      } else if (this.metrics.fid > 100) {
        score -= 10;
        recommendations.push('FID could be improved - consider code splitting');
      }
    }

    // CLS scoring (Core Web Vital)
    if (this.metrics.cls) {
      if (this.metrics.cls > 0.25) {
        score -= 20;
        recommendations.push('Fix Cumulative Layout Shift (CLS) - ensure proper image dimensions');
      } else if (this.metrics.cls > 0.1) {
        score -= 10;
        recommendations.push('CLS could be improved - optimize layout stability');
      }
    }

    // Component performance
    const slowComponents = Array.from(this.componentMetrics.values())
      .filter(comp => comp.renderTime > 16);
    
    if (slowComponents.length > 0) {
      score -= slowComponents.length * 5;
      recommendations.push(`Optimize slow components: ${slowComponents.map(c => c.name).join(', ')}`);
    }

    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

    return { score, grade, recommendations };
  }

  // Report metric to analytics (can be extended)
  private reportMetric(name: string, value: number) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms`);
    }

    // Send to analytics service (Google Analytics, etc.)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name, {
        event_category: 'Performance',
        value: Math.round(value),
      });
    }
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.componentMetrics.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance monitoring
export function usePerformanceMonitor(componentName: string, props?: any) {
  const isDevMode = process.env.NODE_ENV === 'development';
  const isEnabled = !isDevMode || process.env.NEXT_PUBLIC_ENABLE_PERF_MONITOR === 'true';
  
  const startTime = React.useRef<number>();
  const [renderTime, setRenderTime] = React.useState<number>();
  const hasRendered = React.useRef(false);
  
  // Only measure on mount and when component name changes
  React.useEffect(() => {
    if (!isEnabled) return;
    
    startTime.current = performance.now();
    hasRendered.current = false;
  }, [componentName, isEnabled]);

  // Measure render time only once per render cycle
  React.useLayoutEffect(() => {
    if (!isEnabled || !startTime.current || hasRendered.current) return;
    
    const time = performance.now() - startTime.current;
    hasRendered.current = true;
    
    // Set render time without causing infinite updates
    setRenderTime(time);
    
    // Log performance data without triggering re-renders
    try {
      const endRender = performanceMonitor.startComponentRender(componentName, props);
      endRender();
    } catch (error) {
      console.warn('Performance monitoring error:', error);
    }
  }, [isEnabled, componentName]); // Stable dependencies

  return { renderTime: isEnabled ? renderTime : undefined };
}

// Higher-order component for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const PerformanceWrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    
    // Memoize the component name to prevent unnecessary re-renders
    const memoizedName = React.useMemo(() => name, [name]);
    
    // Always call the hook (it handles dev mode internally)
    const { renderTime } = usePerformanceMonitor(memoizedName, props);

    // Add performance data as dev comment only when enabled and available
    if (renderTime && renderTime > 0) {
      console.debug(`🎯 ${memoizedName} render time: ${renderTime.toFixed(2)}ms`);
    }

    return <Component {...props} ref={ref} />;
  });

  PerformanceWrappedComponent.displayName = `withPerformanceMonitoring(${componentName || Component.displayName || Component.name})`;
  return PerformanceWrappedComponent;
}

// Performance debugging tools for development
export const PerformanceDebugger = {
  logMetrics: () => {
    const metrics = performanceMonitor.getMetrics();
    console.table(metrics);
    return metrics;
  },

  logComponentMetrics: () => {
    const metrics = performanceMonitor.getMetrics();
    console.table(metrics.components);
    return metrics.components;
  },

  getSlowComponents: (threshold = 16) => {
    const metrics = performanceMonitor.getMetrics();
    return metrics.components.filter(comp => comp.renderTime > threshold);
  },

  getPerformanceScore: () => {
    return performanceMonitor.calculateScore();
  },

  startProfiling: (duration = 10000) => {
    console.log(`Starting performance profiling for ${duration}ms...`);
    const startMetrics = performanceMonitor.getMetrics();
    
    setTimeout(() => {
      const endMetrics = performanceMonitor.getMetrics();
      console.log('Performance profiling complete:');
      console.log('Start:', startMetrics);
      console.log('End:', endMetrics);
      console.log('Score:', performanceMonitor.calculateScore());
    }, duration);
  },
};

// Add to window for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).PerformanceDebugger = PerformanceDebugger;
  (window as any).performanceMonitor = performanceMonitor;
}