// src/lib/video-preloader.ts
"use client";

import { VIDEO_QUALITY_PRESETS } from './video-compression';

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

interface PreloadOptions {
  priority: 'high' | 'medium' | 'low';
  quality?: keyof typeof VIDEO_QUALITY_PRESETS;
  format?: 'mp4' | 'webm';
  timeout?: number;
  maxConcurrent?: number;
}

interface PreloadProgress {
  videoId: string;
  src: string;
  progress: number;
  loaded: boolean;
  error?: string;
  startTime: number;
  endTime?: number;
}

class VideoPreloader {
  private preloadQueue: Map<string, VideoSource[]> = new Map();
  private preloadProgress: Map<string, PreloadProgress> = new Map();
  private activePreloads: Map<string, XMLHttpRequest> = new Map();
  private preloadCache: Map<string, ArrayBuffer> = new Map();
  private maxConcurrentPreloads = 3;
  private priorityQueue: { videoId: string; priority: number; sources: VideoSource[] }[] = [];

  // Network condition detection
  private connectionSpeed: 'slow' | 'medium' | 'fast' = 'medium';
  private bandwidthEstimate = 1000; // kbps

  constructor() {
    this.detectNetworkConditions();
    this.setupNetworkMonitoring();
  }

  /**
   * Add videos to preload queue with priority
   */
  addToQueue(videoId: string, sources: VideoSource[], options: PreloadOptions = { priority: 'medium' }) {
    // Filter sources based on network conditions and options
    const filteredSources = this.filterSourcesByConditions(sources, options);
    
    this.preloadQueue.set(videoId, filteredSources);
    
    // Add to priority queue
    const priorityScore = this.getPriorityScore(options.priority);
    this.priorityQueue.push({ videoId, priority: priorityScore, sources: filteredSources });
    this.priorityQueue.sort((a, b) => b.priority - a.priority);
    
    this.processQueue();
  }

  /**
   * Preload specific video immediately
   */
  async preloadVideo(videoId: string, sources: VideoSource[], options: PreloadOptions = { priority: 'high' }): Promise<void> {
    const optimalSource = this.selectOptimalSource(sources, options);
    if (!optimalSource) {
      throw new Error('No suitable video source found');
    }

    return new Promise((resolve, reject) => {
      const progress: PreloadProgress = {
        videoId,
        src: optimalSource.src,
        progress: 0,
        loaded: false,
        startTime: Date.now(),
      };

      this.preloadProgress.set(videoId, progress);

      const xhr = new XMLHttpRequest();
      xhr.open('GET', optimalSource.src, true);
      xhr.responseType = 'arraybuffer';
      xhr.timeout = options.timeout || 30000;

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          progress.progress = (event.loaded / event.total) * 100;
          this.preloadProgress.set(videoId, { ...progress });
          this.emitProgressEvent(videoId, progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          progress.loaded = true;
          progress.endTime = Date.now();
          progress.progress = 100;
          
          // Cache the video data
          this.preloadCache.set(optimalSource.src, xhr.response);
          this.preloadProgress.set(videoId, { ...progress });
          
          // Update bandwidth estimate
          this.updateBandwidthEstimate(progress);
          
          this.emitProgressEvent(videoId, progress);
          resolve();
        } else {
          const error = `Failed to preload video: ${xhr.status}`;
          progress.error = error;
          this.preloadProgress.set(videoId, { ...progress });
          reject(new Error(error));
        }
      };

      xhr.onerror = () => {
        const error = 'Network error during video preload';
        progress.error = error;
        this.preloadProgress.set(videoId, { ...progress });
        reject(new Error(error));
      };

      xhr.ontimeout = () => {
        const error = 'Video preload timeout';
        progress.error = error;
        this.preloadProgress.set(videoId, { ...progress });
        reject(new Error(error));
      };

      this.activePreloads.set(videoId, xhr);
      xhr.send();
    });
  }

  /**
   * Get preload progress for a video
   */
  getProgress(videoId: string): PreloadProgress | undefined {
    return this.preloadProgress.get(videoId);
  }

  /**
   * Check if video is preloaded
   */
  isPreloaded(src: string): boolean {
    return this.preloadCache.has(src);
  }

  /**
   * Get cached video data
   */
  getCachedVideo(src: string): ArrayBuffer | undefined {
    return this.preloadCache.get(src);
  }

  /**
   * Cancel preload for a video
   */
  cancelPreload(videoId: string): void {
    const xhr = this.activePreloads.get(videoId);
    if (xhr) {
      xhr.abort();
      this.activePreloads.delete(videoId);
    }
    
    this.preloadProgress.delete(videoId);
    this.preloadQueue.delete(videoId);
    
    // Remove from priority queue
    this.priorityQueue = this.priorityQueue.filter(item => item.videoId !== videoId);
  }

  /**
   * Clear all preload cache
   */
  clearCache(): void {
    this.preloadCache.clear();
    this.preloadProgress.clear();
    this.activePreloads.forEach(xhr => xhr.abort());
    this.activePreloads.clear();
    this.preloadQueue.clear();
    this.priorityQueue = [];
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalSize = Array.from(this.preloadCache.values())
      .reduce((total, buffer) => total + buffer.byteLength, 0);
    
    return {
      cachedVideos: this.preloadCache.size,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      activePreloads: this.activePreloads.size,
      queueLength: this.priorityQueue.length,
      connectionSpeed: this.connectionSpeed,
      bandwidthEstimate: this.bandwidthEstimate,
    };
  }

  private filterSourcesByConditions(sources: VideoSource[], options: PreloadOptions): VideoSource[] {
    let filtered = [...sources];

    // Filter by format preference
    if (options.format) {
      filtered = filtered.filter(source => source.format === options.format);
    }

    // Filter by quality based on network conditions
    if (this.connectionSpeed === 'slow') {
      filtered = filtered.filter(source => 
        source.quality === 'low' || source.quality === 'medium'
      );
    } else if (this.connectionSpeed === 'medium') {
      filtered = filtered.filter(source => 
        source.quality !== 'ultra'
      );
    }

    // Sort by quality preference
    const qualityOrder = { low: 0, medium: 1, high: 2, ultra: 3 };
    filtered.sort((a, b) => qualityOrder[a.quality] - qualityOrder[b.quality]);

    return filtered;
  }

  private selectOptimalSource(sources: VideoSource[], options: PreloadOptions): VideoSource | null {
    const filtered = this.filterSourcesByConditions(sources, options);
    
    if (filtered.length === 0) return null;

    // Prefer specified quality
    if (options.quality) {
      const preferred = filtered.find(source => source.quality === options.quality);
      if (preferred) return preferred;
    }

    // Select based on network conditions
    if (this.connectionSpeed === 'slow') {
      return filtered.find(source => source.quality === 'low') || filtered[0];
    } else if (this.connectionSpeed === 'fast') {
      return filtered.find(source => source.quality === 'high') || filtered[filtered.length - 1];
    }

    // Default to medium quality
    return filtered.find(source => source.quality === 'medium') || filtered[Math.floor(filtered.length / 2)];
  }

  private getPriorityScore(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.activePreloads.size >= this.maxConcurrentPreloads || this.priorityQueue.length === 0) {
      return;
    }

    const item = this.priorityQueue.shift();
    if (!item) return;

    try {
      await this.preloadVideo(item.videoId, item.sources, { priority: 'medium' });
    } catch (error) {
      console.warn(`Failed to preload video ${item.videoId}:`, error);
    }

    // Process next item
    setTimeout(() => this.processQueue(), 100);
  }

  private detectNetworkConditions(): void {
    // Use Navigator Connection API if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection.effectiveType;
      
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          this.connectionSpeed = 'slow';
          this.bandwidthEstimate = 250;
          break;
        case '3g':
          this.connectionSpeed = 'medium';
          this.bandwidthEstimate = 1000;
          break;
        case '4g':
        default:
          this.connectionSpeed = 'fast';
          this.bandwidthEstimate = 5000;
          break;
      }
    }

    // Fallback: measure download speed
    this.measureBandwidth();
  }

  private async measureBandwidth(): Promise<void> {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/video/speed-test', { method: 'HEAD' });
      const endTime = Date.now();
      
      if (response.ok) {
        const duration = endTime - startTime;
        // Estimate based on response time
        if (duration > 2000) {
          this.connectionSpeed = 'slow';
          this.bandwidthEstimate = 250;
        } else if (duration > 1000) {
          this.connectionSpeed = 'medium';
          this.bandwidthEstimate = 1000;
        } else {
          this.connectionSpeed = 'fast';
          this.bandwidthEstimate = 5000;
        }
      }
    } catch (error) {
      console.warn('Bandwidth measurement failed:', error);
    }
  }

  private setupNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.detectNetworkConditions();
      });
    }
  }

  private updateBandwidthEstimate(progress: PreloadProgress): void {
    if (progress.endTime && progress.startTime) {
      const duration = (progress.endTime - progress.startTime) / 1000; // seconds
      const videoElement = document.createElement('video');
      videoElement.src = progress.src;
      
      // Estimate file size (rough calculation)
      const estimatedSizeKB = this.preloadCache.get(progress.src)?.byteLength || 0;
      if (estimatedSizeKB > 0 && duration > 0) {
        const speedKbps = (estimatedSizeKB * 8) / duration / 1000;
        this.bandwidthEstimate = Math.round((this.bandwidthEstimate + speedKbps) / 2);
      }
    }
  }

  private emitProgressEvent(videoId: string, progress: PreloadProgress): void {
    const event = new CustomEvent('videoPreloadProgress', {
      detail: { videoId, progress },
    });
    window.dispatchEvent(event);
  }
}

// Global instance
let preloaderInstance: VideoPreloader | null = null;

export const getVideoPreloader = (): VideoPreloader => {
  if (!preloaderInstance) {
    preloaderInstance = new VideoPreloader();
  }
  return preloaderInstance;
};

export type { VideoSource, PreloadOptions, PreloadProgress };
export { VideoPreloader };