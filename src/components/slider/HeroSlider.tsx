// src/components/slider/HeroSlider.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Slide } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { AdaptiveVideoPlayer, useAdaptiveVideo } from "@/components/video/AdaptiveVideoPlayer";
import { VideoUtils } from "@/lib/video-compression";
import { usePerformanceMonitor } from "@/lib/performance";

interface VideoSource {
  src: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  format: 'mp4' | 'webm';
  bitrate: number;
  resolution: {
    width: number;
    height: number;
  };
}

interface OptimizedSlide extends Slide {
  videoSources?: VideoSource[];
  poster?: string;
}

interface HeroSliderProps {
  slides: OptimizedSlide[];
  autoSlideInterval?: number;
  enableVideoCompression?: boolean;
}

export default function HeroSlider({
  slides,
  autoSlideInterval = 5000,
  enableVideoCompression = true,
}: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [loadedMedia, setLoadedMedia] = useState<Set<string>>(new Set());
  const [loadingMedia, setLoadingMedia] = useState<Set<string>>(new Set());
  const [videoSources, setVideoSources] = useState<{ [key: string]: VideoSource[] }>({});
  const [posters, setPosters] = useState<{ [key: string]: string }>({});
  
  const imageRefs = useRef<{ [key: string]: HTMLImageElement | null }>({});
  
  // Performance monitoring
  const { renderTime } = usePerformanceMonitor('HeroSlider');

  // Initialize video sources for adaptive streaming
  useEffect(() => {
    const initializeVideoSources = async () => {
      const newVideoSources: { [key: string]: VideoSource[] } = {};
      const newPosters: { [key: string]: string } = {};

      for (const slide of slides) {
        if (slide.type === "VIDEO" && slide.mediaUrl) {
          // Check if we have predefined video sources
          if (slide.videoSources && slide.videoSources.length > 0) {
            newVideoSources[slide.id] = slide.videoSources;
          } else if (enableVideoCompression) {
            // Generate adaptive video sources from the original
            newVideoSources[slide.id] = await generateAdaptiveVideoSources(slide.mediaUrl);
          } else {
            // Use original video as single source
            newVideoSources[slide.id] = [{
              src: slide.mediaUrl,
              quality: 'medium',
              format: 'mp4',
              bitrate: 1000,
              resolution: { width: 1280, height: 720 },
            }];
          }

          // Generate poster image if available
          if (slide.poster) {
            newPosters[slide.id] = slide.poster;
          } else {
            try {
              const posterUrl = await VideoUtils.generatePoster(slide.mediaUrl);
              newPosters[slide.id] = posterUrl;
            } catch (error) {
              console.warn('Failed to generate poster for', slide.mediaUrl, error);
            }
          }
        }
      }

      setVideoSources(newVideoSources);
      setPosters(newPosters);
    };

    initializeVideoSources();
  }, [slides, enableVideoCompression]);

  // Generate adaptive video sources
  const generateAdaptiveVideoSources = async (originalUrl: string): Promise<VideoSource[]> => {
    // Check if compressed versions exist
    try {
      const response = await fetch('/api/video/compress-existing', {
        method: 'GET',
      });
      
      if (response.ok) {
        const { videos } = await response.json();
        const baseName = originalUrl.split('/').pop()?.split('.')[0];
        
        const adaptiveSources: VideoSource[] = [];
        
        // Map compressed videos to sources
        const qualityMap = {
          '_360p': 'low' as const,
          '_480p': 'medium' as const,
          '_720p': 'high' as const,
          '_1080p': 'ultra' as const,
        };
        
        for (const video of videos) {
          for (const [suffix, quality] of Object.entries(qualityMap)) {
            if (video.filename.includes(baseName) && video.filename.includes(suffix)) {
              const format = video.filename.endsWith('.webm') ? 'webm' : 'mp4';
              
              adaptiveSources.push({
                src: video.url,
                quality,
                format,
                bitrate: quality === 'low' ? 400 : quality === 'medium' ? 800 : quality === 'high' ? 1200 : 2000,
                resolution: {
                  width: quality === 'low' ? 640 : quality === 'medium' ? 854 : quality === 'high' ? 1280 : 1920,
                  height: quality === 'low' ? 360 : quality === 'medium' ? 480 : quality === 'high' ? 720 : 1080,
                },
              });
            }
          }
        }
        
        if (adaptiveSources.length > 0) {
          return adaptiveSources;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch compressed videos:', error);
    }
    
    // Fallback to original video
    return [{
      src: originalUrl,
      quality: 'medium',
      format: 'mp4',
      bitrate: 1000,
      resolution: { width: 1280, height: 720 },
    }];
  };

  // Auto slide functionality
  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(() => {
        if (!isTransitioning) {
          handleNext();
        }
      }, autoSlideInterval);

      return () => clearInterval(timer);
    }
  }, [currentIndex, isTransitioning, isPaused, autoSlideInterval]);

  // Preload strategy for optimized loading
  useEffect(() => {
    const preloadMedia = async () => {
      // Preload current slide immediately
      const currentSlide = slides[currentIndex];
      if (currentSlide) {
        setLoadingMedia(prev => new Set(prev).add(currentSlide.id));
        
        if (currentSlide.type === "IMAGE" && currentSlide.mediaUrl) {
          const img = new Image();
          img.onload = () => {
            setLoadedMedia(prev => new Set(prev).add(currentSlide.id));
            setLoadingMedia(prev => {
              const newSet = new Set(prev);
              newSet.delete(currentSlide.id);
              return newSet;
            });
          };
          img.onerror = () => {
            setLoadingMedia(prev => {
              const newSet = new Set(prev);
              newSet.delete(currentSlide.id);
              return newSet;
            });
          };
          img.src = currentSlide.mediaUrl;
        }
      }
      
      // Preload next slide with lower priority
      setTimeout(() => {
        const nextIndex = (currentIndex + 1) % slides.length;
        const nextSlide = slides[nextIndex];
        if (nextSlide && !loadedMedia.has(nextSlide.id) && !loadingMedia.has(nextSlide.id)) {
          if (nextSlide.type === "IMAGE" && nextSlide.mediaUrl) {
            const img = new Image();
            img.onload = () => setLoadedMedia(prev => new Set(prev).add(nextSlide.id));
            img.src = nextSlide.mediaUrl;
          }
        }
      }, 1000);
    };

    preloadMedia();
  }, [currentIndex, slides, loadedMedia, loadingMedia]);

  const handleNext = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((current) => (current + 1) % slides.length);
      setTimeout(() => setIsTransitioning(false), 750);
    }
  }, [slides.length, isTransitioning]);

  const handlePrev = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(
        (current) => (current - 1 + slides.length) % slides.length
      );
      setTimeout(() => setIsTransitioning(false), 750);
    }
  }, [slides.length, isTransitioning]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  const renderSlideContent = (slide: Slide, isActive: boolean) => {
    const commonClasses = `absolute inset-0 transition-opacity duration-750 ${
      isActive ? "opacity-100" : "opacity-0 pointer-events-none"
    }`;
    
    const isLoading = loadingMedia.has(slide.id);
    const isLoaded = loadedMedia.has(slide.id);

    return (
      <div key={slide.id} className={commonClasses}>
        {/* Loading indicator */}
        {isLoading && isActive && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}
        
        {/* Háttér */}
        {slide.type === "GRADIENT" ? (
          <div
            className="absolute inset-0 bg-gradient-to-r"
            style={{
              backgroundImage: `linear-gradient(to right, ${slide.gradientFrom}, ${slide.gradientTo})`,
            }}
          >
            <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
          </div>
        ) : slide.type === "IMAGE" && slide.mediaUrl ? (
          <div className="absolute inset-0">
            <Image
              src={slide.mediaUrl}
              alt={slide.title}
              fill
              className={`object-cover transition-all duration-[2000ms] ${
                isActive ? "scale-100" : "scale-110"
              } ${!isLoaded ? "blur-sm" : ""}`}
              priority={isActive}
              quality={90}
              sizes="100vw"
              onLoad={() => {
                setLoadedMedia(prev => new Set(prev).add(slide.id));
                setLoadingMedia(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(slide.id);
                  return newSet;
                });
              }}
              onError={() => {
                setLoadingMedia(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(slide.id);
                  return newSet;
                });
              }}
            />
            <div className="absolute inset-0 bg-black/50 backdrop-brightness-75" />
          </div>
        ) : slide.type === "VIDEO" && videoSources[slide.id] ? (
          <div className="absolute inset-0">
            <AdaptiveVideoPlayer
              sources={videoSources[slide.id]}
              poster={posters[slide.id]}
              autoPlay={isActive && slide.autoPlay}
              muted={slide.isMuted}
              loop={slide.isLoop}
              className="w-full h-full"
              enableAdaptiveStreaming={true}
              enableQualitySelector={false} // Hide in hero slider
              preload={isActive ? 'auto' : 'metadata'}
              onLoadedData={() => {
                setLoadedMedia(prev => new Set(prev).add(slide.id));
                setLoadingMedia(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(slide.id);
                  return newSet;
                });
              }}
              onError={(error) => {
                console.error('Video playback error:', error);
                setLoadingMedia(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(slide.id);
                  return newSet;
                });
              }}
            />
            <div className="absolute inset-0 bg-black/30 backdrop-brightness-90" />
          </div>
        ) : null}

        {/* Tartalom */}
        <div className="relative h-full flex flex-col justify-center items-center text-center px-4 md:px-8 max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-4 max-w-4xl text-balance drop-shadow-lg">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="text-base md:text-lg lg:text-xl text-white/90 max-w-2xl mb-6 text-balance drop-shadow-md">
              {slide.subtitle}
            </p>
          )}
          {slide.ctaText && (
            <Link
              href={slide.ctaLink || "#"}
              className="px-5 py-2.5 md:px-6 md:py-3 text-base md:text-lg font-medium rounded-full bg-white hover:bg-white/90 text-blue-600 hover:text-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {slide.ctaText}
            </Link>
          )}
        </div>
      </div>
    );
  };

  if (slides.length === 0) {
    return null;
  }

  return (
    <div
      className="relative w-full aspect-[21/9] max-h-[60vh] overflow-hidden bg-gray-900 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slideok konténer */}
      <div
        className="relative w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, index) =>
          renderSlideContent(slide, index === currentIndex)
        )}
      </div>

      {/* Navigációs gombok */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={handlePrev}
          className="pointer-events-auto p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all duration-300 backdrop-blur-sm transform hover:scale-110"
          aria-label="Előző slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          className="pointer-events-auto p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all duration-300 backdrop-blur-sm transform hover:scale-110"
          aria-label="Következő slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide indikátorok */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isTransitioning) {
                setIsTransitioning(true);
                setCurrentIndex(index);
                setTimeout(() => setIsTransitioning(false), 750);
              }
            }}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-4 bg-white"
                : "bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`${index + 1}. slide`}
          />
        ))}
      </div>

      {/* Performance indicator (development only) */}
      {process.env.NODE_ENV === 'development' && renderTime && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Render: {renderTime.toFixed(1)}ms
        </div>
      )}
    </div>
  );
}
