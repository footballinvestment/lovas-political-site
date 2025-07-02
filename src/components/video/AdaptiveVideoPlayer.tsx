// src/components/video/AdaptiveVideoPlayer.tsx
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VIDEO_QUALITY_PRESETS, VideoUtils } from '@/lib/video-compression';
import { usePerformanceMonitor } from '@/lib/performance';
import { getVideoAnalytics } from '@/lib/video-analytics';
import { getVideoPreloader } from '@/lib/video-preloader';
import { getServiceWorkerManager } from '@/lib/service-worker-manager';

interface VideoSource {
  src: string;
  quality: keyof typeof VIDEO_QUALITY_PRESETS;
  format: 'mp4' | 'webm';
  bitrate: number;
  resolution: {
    width: number;
    height: number;
  };
}

interface AdaptiveVideoPlayerProps {
  sources: VideoSource[];
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
  onLoadStart?: () => void;
  onLoadedData?: () => void;
  onError?: (error: Error) => void;
  onQualityChange?: (quality: string) => void;
  enableAdaptiveStreaming?: boolean;
  enableQualitySelector?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
}

export function AdaptiveVideoPlayer({
  sources,
  poster,
  autoPlay = false,
  muted = true,
  loop = false,
  controls = false,
  className = '',
  onLoadStart,
  onLoadedData,
  onError,
  onQualityChange,
  enableAdaptiveStreaming = true,
  enableQualitySelector = true,
  preload = 'metadata',
}: AdaptiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentQuality, setCurrentQuality] = useState<keyof typeof VIDEO_QUALITY_PRESETS>('medium');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkSpeed, setNetworkSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [bufferHealth, setBufferHealth] = useState(100);
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  
  // Performance monitoring
  const { renderTime } = usePerformanceMonitor('AdaptiveVideoPlayer');
  
  // Analytics and caching
  const analytics = getVideoAnalytics();
  const preloader = getVideoPreloader();
  const serviceWorker = getServiceWorkerManager();
  const [videoId] = useState(() => `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Initialize video sources and quality
  useEffect(() => {
    if (sources.length === 0) return;

    // Sort sources by quality (lowest to highest)
    const sortedSources = [...sources].sort((a, b) => {
      const qualityOrder = { low: 0, medium: 1, high: 2, ultra: 3 };
      return qualityOrder[a.quality] - qualityOrder[b.quality];
    });

    setAvailableQualities(sortedSources.map(s => s.quality));

    // Detect optimal initial quality
    const optimalQuality = getOptimalQuality();
    const initialSource = sortedSources.find(s => s.quality === optimalQuality) || sortedSources[0];
    
    setCurrentQuality(initialSource.quality);
    loadVideoSource(initialSource);

    // Start analytics session
    analytics.startSession(videoId, initialSource.src);

    // Preload video sources
    preloadVideoSources();

    // Initialize service worker video caching
    initializeVideoCaching();

  }, [sources]);

  // Adaptive streaming based on network conditions
  useEffect(() => {
    if (!enableAdaptiveStreaming || !videoRef.current) return;

    const video = videoRef.current;
    let qualityCheckInterval: NodeJS.Timeout;

    const startAdaptiveStreaming = () => {
      qualityCheckInterval = setInterval(() => {
        checkAndAdaptQuality();
      }, 5000); // Check every 5 seconds
    };

    const stopAdaptiveStreaming = () => {
      if (qualityCheckInterval) {
        clearInterval(qualityCheckInterval);
      }
    };

    video.addEventListener('loadstart', startAdaptiveStreaming);
    video.addEventListener('ended', stopAdaptiveStreaming);
    video.addEventListener('pause', stopAdaptiveStreaming);
    video.addEventListener('play', startAdaptiveStreaming);

    return () => {
      video.removeEventListener('loadstart', startAdaptiveStreaming);
      video.removeEventListener('ended', stopAdaptiveStreaming);
      video.removeEventListener('pause', stopAdaptiveStreaming);
      video.removeEventListener('play', stopAdaptiveStreaming);
      stopAdaptiveStreaming();
    };
  }, [enableAdaptiveStreaming, currentQuality]);

  // Network speed detection
  useEffect(() => {
    const detectedSpeed = VideoUtils.detectConnectionSpeed();
    setNetworkSpeed(detectedSpeed);
  }, []);

  const getOptimalQuality = useCallback((): keyof typeof VIDEO_QUALITY_PRESETS => {
    // Consider viewport size
    const viewportQuality = VideoUtils.getOptimalQualityForViewport();
    
    // Consider network speed
    const networkQuality = networkSpeed === 'slow' ? 'low' : 
                          networkSpeed === 'medium' ? 'medium' : 'high';
    
    // Choose the more conservative option
    const qualityOrder = { low: 0, medium: 1, high: 2, ultra: 3 };
    const finalQuality = qualityOrder[viewportQuality] <= qualityOrder[networkQuality] 
      ? viewportQuality 
      : networkQuality;

    return finalQuality;
  }, [networkSpeed]);

  const loadVideoSource = useCallback((source: VideoSource) => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const currentTime = video.currentTime;
    const wasPaused = video.paused;

    setIsLoading(true);
    setError(null);

    // Find best format for the browser
    const preferredFormat = canPlayFormat('webm') ? 'webm' : 'mp4';
    const sourceToLoad = sources.find(s => 
      s.quality === source.quality && s.format === preferredFormat
    ) || source;

    video.src = sourceToLoad.src;
    video.currentTime = currentTime;

    const handleLoadedData = () => {
      setIsLoading(false);
      if (!wasPaused && autoPlay) {
        video.play().catch(console.error);
      }
      onLoadedData?.();
    };

    const handleError = () => {
      const errorMsg = `Failed to load video quality: ${source.quality}`;
      setError(errorMsg);
      setIsLoading(false);
      onError?.(new Error(errorMsg));
    };

    video.addEventListener('loadeddata', handleLoadedData, { once: true });
    video.addEventListener('error', handleError, { once: true });

    onLoadStart?.();
  }, [sources, autoPlay, onLoadStart, onLoadedData, onError]);

  const checkAndAdaptQuality = useCallback(() => {
    if (!videoRef.current || !enableAdaptiveStreaming) return;

    const video = videoRef.current;
    
    // Check buffer health
    const buffered = video.buffered;
    const currentTime = video.currentTime;
    let bufferAhead = 0;

    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && buffered.end(i) > currentTime) {
        bufferAhead = buffered.end(i) - currentTime;
        break;
      }
    }

    const newBufferHealth = Math.min((bufferAhead / 10) * 100, 100); // 10 seconds = 100%
    setBufferHealth(newBufferHealth);

    // Adapt quality based on buffer health and network conditions
    if (newBufferHealth < 20 && currentQuality !== 'low') {
      // Buffer is low, downgrade quality
      const currentIndex = availableQualities.indexOf(currentQuality);
      if (currentIndex > 0) {
        const newQuality = availableQualities[currentIndex - 1] as keyof typeof VIDEO_QUALITY_PRESETS;
        changeQuality(newQuality);
      }
    } else if (newBufferHealth > 80 && currentQuality !== 'ultra') {
      // Buffer is healthy, try to upgrade quality
      const optimalQuality = getOptimalQuality();
      const currentIndex = availableQualities.indexOf(currentQuality);
      const optimalIndex = availableQualities.indexOf(optimalQuality);
      
      if (optimalIndex > currentIndex) {
        changeQuality(optimalQuality);
      }
    }
  }, [currentQuality, availableQualities, enableAdaptiveStreaming, getOptimalQuality]);

  const changeQuality = useCallback((quality: keyof typeof VIDEO_QUALITY_PRESETS) => {
    const newSource = sources.find(s => s.quality === quality);
    if (newSource && newSource.quality !== currentQuality) {
      setCurrentQuality(quality);
      loadVideoSource(newSource);
      onQualityChange?.(quality);
    }
  }, [sources, currentQuality, loadVideoSource, onQualityChange]);

  const canPlayFormat = (format: string): boolean => {
    const video = document.createElement('video');
    return video.canPlayType(`video/${format}`) !== '';
  };

  const handleQualitySelect = (quality: string) => {
    const oldQuality = currentQuality;
    changeQuality(quality as keyof typeof VIDEO_QUALITY_PRESETS);
    setShowQualitySelector(false);
    
    // Track quality change
    if (videoRef.current && oldQuality !== quality) {
      analytics.trackQualityChange(
        videoId,
        videoRef.current.src,
        videoRef.current.currentTime,
        videoRef.current.duration,
        oldQuality,
        quality
      );
    }
  };

  const getQualityLabel = (quality: string) => {
    const preset = VIDEO_QUALITY_PRESETS[quality as keyof typeof VIDEO_QUALITY_PRESETS];
    return `${preset.resolution.height}p`;
  };

  // Preload video sources
  const preloadVideoSources = useCallback(async () => {
    if (sources.length <= 1) return;

    try {
      // Add all sources to preloader
      const videoSources = sources.map(source => ({
        src: source.src,
        quality: source.quality,
        format: source.format,
        bitrate: source.bitrate,
        resolution: source.resolution,
      }));

      await preloader.addToQueue(videoId, videoSources, { priority: 'medium' });

      // Also preload via service worker
      for (const source of sources) {
        await serviceWorker.preloadVideo(source.src, 'medium');
      }
    } catch (error) {
      console.warn('Failed to preload video sources:', error);
    }
  }, [sources, videoId]);

  // Initialize video caching
  const initializeVideoCaching = useCallback(async () => {
    try {
      await serviceWorker.initialize();
      
      // Listen for cache events
      window.addEventListener('videoCached', (event: any) => {
        console.log('Video cached:', event.detail.url);
      });

      window.addEventListener('videoCacheError', (event: any) => {
        console.warn('Video cache error:', event.detail.url, event.detail.error);
      });

    } catch (error) {
      console.warn('Failed to initialize video caching:', error);
    }
  }, []);

  // Setup video event listeners for analytics
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      analytics.trackEvent('play', videoId, video.src, {
        currentTime: video.currentTime,
        duration: video.duration,
        quality: currentQuality,
        bufferHealth,
        networkSpeed,
      });
    };

    const handlePause = () => {
      analytics.trackEvent('pause', videoId, video.src, {
        currentTime: video.currentTime,
        duration: video.duration,
        quality: currentQuality,
        bufferHealth,
      });
    };

    const handleSeeked = () => {
      analytics.trackEvent('seek', videoId, video.src, {
        currentTime: video.currentTime,
        duration: video.duration,
        quality: currentQuality,
      });
    };

    const handleEnded = () => {
      analytics.trackEvent('ended', videoId, video.src, {
        currentTime: video.currentTime,
        duration: video.duration,
        quality: currentQuality,
      });
    };

    const handleError = () => {
      const errorMsg = `Video error: ${video.error?.message || 'Unknown error'}`;
      analytics.trackEvent('error', videoId, video.src, {
        currentTime: video.currentTime,
        duration: video.duration,
        metadata: { errorCode: video.error?.code },
      });
    };

    const handleWaiting = () => {
      analytics.trackBufferEvent('bufferStart', videoId, video.src, video.currentTime, video.duration, bufferHealth);
    };

    const handleCanPlay = () => {
      analytics.trackBufferEvent('bufferEnd', videoId, video.src, video.currentTime, video.duration, bufferHealth);
    };

    const handleTimeUpdate = () => {
      // Track progress periodically
      analytics.trackProgress(videoId, video.src, video.currentTime, video.duration, bufferHealth, currentQuality);
    };

    // Add event listeners
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      // Remove event listeners
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoRef.current, videoId, currentQuality, bufferHealth, networkSpeed]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={controls}
        preload={preload}
        className="w-full h-full object-cover"
        playsInline
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="flex items-center space-x-3 text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span>Loading {getQualityLabel(currentQuality)} quality...</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-center">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 8.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p>Video playback error</p>
            <p className="text-sm opacity-75">{error}</p>
          </div>
        </div>
      )}

      {/* Quality selector */}
      {enableQualitySelector && availableQualities.length > 1 && (
        <div className="absolute bottom-4 right-4">
          <div className="relative">
            <button
              onClick={() => setShowQualitySelector(!showQualitySelector)}
              className="bg-black bg-opacity-50 text-white px-3 py-2 rounded flex items-center space-x-2 hover:bg-opacity-75 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{getQualityLabel(currentQuality)}</span>
            </button>

            {showQualitySelector && (
              <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-75 rounded overflow-hidden">
                {availableQualities.map((quality) => (
                  <button
                    key={quality}
                    onClick={() => handleQualitySelect(quality)}
                    className={`block w-full text-left px-4 py-2 text-white hover:bg-white hover:bg-opacity-20 transition-colors ${
                      quality === currentQuality ? 'bg-white bg-opacity-20' : ''
                    }`}
                  >
                    {getQualityLabel(quality)}
                    {quality === currentQuality && (
                      <span className="ml-2 text-green-400">✓</span>
                    )}
                  </button>
                ))}
                <div className="px-4 py-2 text-xs text-gray-300 border-t border-gray-600">
                  Auto: {enableAdaptiveStreaming ? 'On' : 'Off'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Buffer health indicator (development mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Buffer: {bufferHealth.toFixed(0)}%
        </div>
      )}

      {/* Network speed indicator (development mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Network: {networkSpeed}
        </div>
      )}
    </div>
  );
}

// Hook for using adaptive video player
export function useAdaptiveVideo(sources: VideoSource[]) {
  const [currentQuality, setCurrentQuality] = useState<string>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQualityChange = useCallback((quality: string) => {
    setCurrentQuality(quality);
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback((error: Error) => {
    setError(error.message);
    setIsLoading(false);
  }, []);

  return {
    currentQuality,
    isLoading,
    error,
    handlers: {
      onQualityChange: handleQualityChange,
      onLoadStart: handleLoadStart,
      onLoadedData: handleLoadedData,
      onError: handleError,
    },
  };
}