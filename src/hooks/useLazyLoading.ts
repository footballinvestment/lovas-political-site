// src/hooks/useLazyLoading.ts
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseLazyLoadingOptions {
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
  enabled?: boolean;
}

export function useLazyLoading<T extends HTMLElement = HTMLDivElement>(
  options: UseLazyLoadingOptions = {}
) {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true,
    enabled = true,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled || (triggerOnce && hasTriggered)) return;

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const isVisible = entry.isIntersecting;
        
        setIsIntersecting(isVisible);
        
        if (isVisible && triggerOnce) {
          setHasTriggered(true);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [rootMargin, threshold, triggerOnce, enabled, hasTriggered]);

  const isVisible = triggerOnce ? (hasTriggered || isIntersecting) : isIntersecting;

  return {
    elementRef,
    isVisible,
    isIntersecting,
    hasTriggered,
  };
}

// Hook for lazy loading images
export function useLazyImage(src: string, options: UseLazyLoadingOptions = {}) {
  const { elementRef, isVisible } = useLazyLoading<HTMLImageElement>(options);
  const [imageSrc, setImageSrc] = useState<string | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!isVisible || imageSrc) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      setIsError(true);
    };
    img.src = src;
  }, [isVisible, src, imageSrc]);

  return {
    elementRef,
    imageSrc,
    isLoaded,
    isError,
    isVisible,
  };
}

// Hook for lazy loading components
export function useLazyComponent<T extends HTMLElement = HTMLDivElement>(
  options: UseLazyLoadingOptions = {}
) {
  const { elementRef, isVisible } = useLazyLoading<T>(options);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible && !shouldRender) {
      // Add a small delay to ensure smooth rendering
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, shouldRender]);

  return {
    elementRef,
    shouldRender,
    isVisible,
  };
}

// Hook for preloading resources when element is near viewport
export function usePreloader(
  resources: string[],
  options: UseLazyLoadingOptions = {}
) {
  const { elementRef, isVisible } = useLazyLoading(options);
  const [preloadedResources, setPreloadedResources] = useState<Set<string>>(new Set());

  const preloadResource = useCallback((url: string) => {
    if (preloadedResources.has(url)) return;

    // Determine resource type
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(extension || '')) {
      // Preload image
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    } else if (['mp4', 'webm', 'ogg'].includes(extension || '')) {
      // Preload video
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = url;
      document.head.appendChild(link);
    } else {
      // Preload as fetch
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      document.head.appendChild(link);
    }

    setPreloadedResources(prev => new Set([...prev, url]));
  }, [preloadedResources]);

  useEffect(() => {
    if (!isVisible) return;

    resources.forEach(preloadResource);
  }, [isVisible, resources, preloadResource]);

  return {
    elementRef,
    isVisible,
    preloadedResources,
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const startTime = useRef<number>();
  const [renderTime, setRenderTime] = useState<number>();

  useEffect(() => {
    startTime.current = performance.now();
  }, []);

  useEffect(() => {
    if (startTime.current) {
      const time = performance.now() - startTime.current;
      setRenderTime(time);
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} rendered in ${time.toFixed(2)}ms`);
      }
    }
  }, [componentName]); // Add componentName dependency to fix infinite loop

  const logInteraction = useCallback((interaction: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} - ${interaction}`);
    }
  }, [componentName]);

  return {
    renderTime,
    logInteraction,
  };
}