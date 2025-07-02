// src/components/common/OptimizedImage.tsx
"use client";

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { useLazyImage } from '@/hooks/useLazyLoading';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: 'blur' | 'empty' | string;
  blurDataURL?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  lazy?: boolean;
  rootMargin?: string;
  threshold?: number;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  placeholder = 'blur',
  blurDataURL,
  priority = false,
  quality = 85,
  sizes,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.jpg',
  lazy = true,
  rootMargin = '50px',
  threshold = 0.1,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Use lazy loading hook if lazy is enabled
  const { elementRef, isVisible } = useLazyImage(src, {
    rootMargin,
    threshold,
    enabled: lazy && !priority,
  });

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
    onError?.();
  }, [onError, fallbackSrc, imageSrc]);

  // Generate blur data URL if not provided
  const generateBlurDataURL = useCallback((width: number, height: number) => {
    if (blurDataURL) return blurDataURL;
    
    // Create a simple base64 encoded blur placeholder
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL();
  }, [blurDataURL]);

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || (
    fill 
      ? '100vw'
      : `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw`
  );

  // Show placeholder while lazy loading or loading
  if (lazy && !priority && !isVisible) {
    return (
      <div
        ref={elementRef}
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className || ''}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          aspectRatio: width && height ? `${width}/${height}` : undefined,
        }}
      />
    );
  }

  const imageProps = {
    src: imageSrc,
    alt,
    className: `transition-opacity duration-300 ${
      isLoading ? 'opacity-0' : 'opacity-100'
    } ${className || ''}`,
    onLoad: handleLoad,
    onError: handleError,
    quality,
    sizes: responsiveSizes,
    priority,
    loading: priority ? 'eager' : loading,
    placeholder: placeholder === 'blur' ? 'blur' as const : 'empty' as const,
    ...(fill
      ? {
          fill: true,
          style: {
            objectFit,
            objectPosition,
          },
        }
      : {
          width: width!,
          height: height!,
        }),
  };

  // Add blur data URL for blur placeholder
  if (placeholder === 'blur' && width && height) {
    (imageProps as any).blurDataURL = generateBlurDataURL(width, height);
  }

  return (
    <div className="relative">
      <Image {...imageProps} />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      )}
      
      {/* Error state */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Kép betöltése sikertelen</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Specialized image components for common use cases
export function HeroImage(props: Omit<OptimizedImageProps, 'priority' | 'sizes'>) {
  return (
    <OptimizedImage
      {...props}
      priority
      sizes="100vw"
      quality={90}
      lazy={false}
    />
  );
}

export function CardImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
      quality={80}
    />
  );
}

export function ThumbnailImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      sizes="(max-width: 768px) 25vw, 10vw"
      quality={75}
    />
  );
}

// Progressive image loading component
export function ProgressiveImage({
  src,
  lowQualitySrc,
  ...props
}: OptimizedImageProps & { lowQualitySrc?: string }) {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || src);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  React.useEffect(() => {
    if (lowQualitySrc && lowQualitySrc !== src) {
      const img = new Image();
      img.onload = () => {
        setCurrentSrc(src);
        setIsHighQualityLoaded(true);
      };
      img.src = src;
    }
  }, [src, lowQualitySrc]);

  return (
    <OptimizedImage
      {...props}
      src={currentSrc}
      className={`${props.className || ''} ${
        isHighQualityLoaded ? '' : 'filter blur-sm'
      } transition-all duration-300`}
    />
  );
}

// Image gallery component with lazy loading
export function ImageGallery({
  images,
  columns = 3,
  gap = 4,
  className,
}: {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  columns?: number;
  gap?: number;
  className?: string;
}) {
  return (
    <div 
      className={`grid gap-${gap} ${className || ''}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {images.map((image, index) => (
        <div key={index} className="relative aspect-square">
          <OptimizedImage
            {...image}
            fill
            objectFit="cover"
            sizes={`(max-width: 768px) 50vw, ${100 / columns}vw`}
            className="rounded-lg"
          />
        </div>
      ))}
    </div>
  );
}