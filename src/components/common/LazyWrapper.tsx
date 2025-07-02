// src/components/common/LazyWrapper.tsx
"use client";

import React, { Suspense, ComponentType } from 'react';
import { useLazyComponent } from '@/hooks/useLazyLoading';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
  enablePerformanceLogging?: boolean;
  componentName?: string;
}

export function LazyWrapper({
  children,
  fallback = <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded" />,
  rootMargin = '100px',
  threshold = 0.1,
  className,
  enablePerformanceLogging = false,
  componentName = 'LazyWrapper',
}: LazyWrapperProps) {
  const { elementRef, shouldRender } = useLazyComponent({
    rootMargin,
    threshold,
    triggerOnce: true,
  });

  React.useEffect(() => {
    if (enablePerformanceLogging && shouldRender) {
      console.log(`[LazyWrapper] ${componentName} loaded`);
    }
  }, [shouldRender, enablePerformanceLogging, componentName]);

  return (
    <div ref={elementRef} className={className}>
      {shouldRender ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options: {
    fallback?: React.ReactNode;
    rootMargin?: string;
    threshold?: number;
    enablePerformanceLogging?: boolean;
  } = {}
) {
  const LazyComponent = React.forwardRef<any, P>((props, ref) => {
    const {
      fallback = <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded" />,
      rootMargin = '50px',
      threshold = 0.1,
      enablePerformanceLogging = false,
    } = options;

    const { elementRef, shouldRender } = useLazyComponent({
      rootMargin,
      threshold,
      triggerOnce: true,
    });

    React.useEffect(() => {
      if (enablePerformanceLogging && shouldRender) {
        console.log(`[LazyHOC] ${Component.displayName || Component.name} loaded`);
      }
    }, [shouldRender]);

    return (
      <div ref={elementRef}>
        {shouldRender ? (
          <Suspense fallback={fallback}>
            <Component {...props} ref={ref} />
          </Suspense>
        ) : (
          fallback
        )}
      </div>
    );
  });

  LazyComponent.displayName = `LazyLoaded(${Component.displayName || Component.name})`;
  return LazyComponent;
}

// Skeleton loading components
export const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
  </div>
);

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
          i === lines - 1 ? 'w-2/3' : 'w-full'
        }`}
      />
    ))}
  </div>
);

export const SkeletonImage = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className || 'h-48 w-full'}`} />
);

export const SkeletonButton = () => (
  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-24 rounded" />
);

// Section skeleton for larger components
export const SkeletonSection = ({ 
  title = true, 
  cards = 3, 
  className 
}: { 
  title?: boolean; 
  cards?: number; 
  className?: string;
}) => (
  <div className={`animate-pulse space-y-6 ${className || ''}`}>
    {title && (
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

// Lazy loading for specific component types
export const LazyEventSection = ({ children, ...props }: LazyWrapperProps) => (
  <LazyWrapper
    fallback={<SkeletonSection title cards={3} className="py-8" />}
    rootMargin="200px"
    {...props}
  >
    {children}
  </LazyWrapper>
);

export const LazyNewsSection = ({ children, ...props }: LazyWrapperProps) => (
  <LazyWrapper
    fallback={<SkeletonSection title cards={4} className="py-8" />}
    rootMargin="200px"
    {...props}
  >
    {children}
  </LazyWrapper>
);

export const LazyContactForm = ({ children, ...props }: LazyWrapperProps) => (
  <LazyWrapper
    fallback={
      <div className="animate-pulse space-y-4 p-6 border rounded-lg">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-10 bg-blue-200 dark:bg-blue-700 rounded w-32" />
      </div>
    }
    rootMargin="100px"
    {...props}
  >
    {children}
  </LazyWrapper>
);