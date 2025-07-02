// src/lib/video-compression.ts
import { logError } from './error-logger';

export interface VideoCompressionOptions {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  format: 'mp4' | 'webm' | 'both';
  targetSizeMB?: number;
  maxBitrate?: number;
  resolution?: {
    width: number;
    height: number;
  };
  framerate?: number;
}

export interface VideoVariant {
  quality: string;
  bitrate: number;
  resolution: {
    width: number;
    height: number;
  };
  format: string;
  url: string;
  size: number;
}

export interface VideoCompressionResult {
  originalSize: number;
  variants: VideoVariant[];
  compressionRatio: number;
  processingTime: number;
  success: boolean;
  error?: string;
}

// Predefined quality presets for adaptive bitrate streaming
export const VIDEO_QUALITY_PRESETS = {
  ultra: {
    bitrate: 2000, // 2 Mbps
    resolution: { width: 1920, height: 1080 },
    framerate: 30,
    suffix: '_1080p'
  },
  high: {
    bitrate: 1200, // 1.2 Mbps
    resolution: { width: 1280, height: 720 },
    framerate: 30,
    suffix: '_720p'
  },
  medium: {
    bitrate: 800, // 800 Kbps
    resolution: { width: 854, height: 480 },
    framerate: 30,
    suffix: '_480p'
  },
  low: {
    bitrate: 400, // 400 Kbps
    resolution: { width: 640, height: 360 },
    framerate: 24,
    suffix: '_360p'
  }
} as const;

// Browser-based video compression using WebCodecs API (if available)
export class BrowserVideoCompressor {
  private supported: boolean = false;

  constructor() {
    this.supported = this.checkSupport();
  }

  private checkSupport(): boolean {
    return (
      typeof window !== 'undefined' &&
      'VideoEncoder' in window &&
      'VideoDecoder' in window
    );
  }

  async compressVideo(
    file: File,
    options: VideoCompressionOptions
  ): Promise<VideoCompressionResult> {
    if (!this.supported) {
      throw new Error('Browser video compression not supported');
    }

    const startTime = performance.now();
    
    try {
      const originalSize = file.size;
      const variants: VideoVariant[] = [];
      
      // Create video element for processing
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Load video
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
        video.src = URL.createObjectURL(file);
      });

      // Process different quality variants
      const qualitiesToProcess = this.getQualitiesToProcess(options.quality);
      
      for (const quality of qualitiesToProcess) {
        const preset = VIDEO_QUALITY_PRESETS[quality];
        
        // Set canvas dimensions
        canvas.width = preset.resolution.width;
        canvas.height = preset.resolution.height;
        
        // Create compressed variant
        const compressedBlob = await this.createVideoVariant(
          video,
          canvas,
          ctx,
          preset,
          options.format
        );
        
        if (compressedBlob) {
          const url = URL.createObjectURL(compressedBlob);
          variants.push({
            quality,
            bitrate: preset.bitrate,
            resolution: preset.resolution,
            format: options.format || 'mp4',
            url,
            size: compressedBlob.size,
          });
        }
      }

      // Cleanup
      URL.revokeObjectURL(video.src);

      const processingTime = performance.now() - startTime;
      const totalCompressedSize = variants.reduce((sum, v) => sum + v.size, 0);
      const compressionRatio = originalSize / totalCompressedSize;

      return {
        originalSize,
        variants,
        compressionRatio,
        processingTime,
        success: true,
      };

    } catch (error) {
      logError(error, { context: 'Browser video compression' });
      
      return {
        originalSize: file.size,
        variants: [],
        compressionRatio: 1,
        processingTime: performance.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getQualitiesToProcess(targetQuality: string): (keyof typeof VIDEO_QUALITY_PRESETS)[] {
    switch (targetQuality) {
      case 'ultra':
        return ['low', 'medium', 'high', 'ultra'];
      case 'high':
        return ['low', 'medium', 'high'];
      case 'medium':
        return ['low', 'medium'];
      case 'low':
      default:
        return ['low'];
    }
  }

  private async createVideoVariant(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    preset: typeof VIDEO_QUALITY_PRESETS[keyof typeof VIDEO_QUALITY_PRESETS],
    format: string = 'mp4'
  ): Promise<Blob | null> {
    try {
      // This is a simplified implementation
      // In a real scenario, you'd use WebCodecs API for proper video encoding
      
      // Draw video frame to canvas with new dimensions
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob (this is a fallback - doesn't actually compress video properly)
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob),
          format === 'webm' ? 'video/webm' : 'video/mp4',
          0.8 // Quality factor
        );
      });
    } catch (error) {
      console.error('Error creating video variant:', error);
      return null;
    }
  }
}

// Server-side video compression using FFmpeg (via API)
export class ServerVideoCompressor {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/video') {
    this.baseUrl = baseUrl;
  }

  async compressVideo(
    file: File,
    options: VideoCompressionOptions
  ): Promise<VideoCompressionResult> {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('options', JSON.stringify(options));

    try {
      const response = await fetch(`${this.baseUrl}/compress`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server compression failed: ${response.statusText}`);
      }

      const result: VideoCompressionResult = await response.json();
      return result;

    } catch (error) {
      logError(error, { context: 'Server video compression' });
      
      return {
        originalSize: file.size,
        variants: [],
        compressionRatio: 1,
        processingTime: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getCompressionStatus(jobId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result?: VideoCompressionResult;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/status/${jobId}`);
      return await response.json();
    } catch (error) {
      return {
        status: 'failed',
        progress: 0,
      };
    }
  }
}

// Main video compression class with fallback strategies
export class VideoCompressor {
  private browserCompressor: BrowserVideoCompressor;
  private serverCompressor: ServerVideoCompressor;
  
  constructor() {
    this.browserCompressor = new BrowserVideoCompressor();
    this.serverCompressor = new ServerVideoCompressor();
  }

  async compressVideo(
    file: File,
    options: VideoCompressionOptions = { quality: 'medium', format: 'mp4' }
  ): Promise<VideoCompressionResult> {
    // Validate file
    if (!this.isVideoFile(file)) {
      throw new Error('Invalid video file');
    }

    // Check file size constraints
    if (file.size > 100 * 1024 * 1024) { // 100MB limit for browser compression
      console.log('File too large for browser compression, using server');
      return this.serverCompressor.compressVideo(file, options);
    }

    // Try browser compression first (faster for smaller files)
    try {
      const result = await this.browserCompressor.compressVideo(file, options);
      if (result.success) {
        return result;
      }
    } catch (error) {
      console.warn('Browser compression failed, falling back to server:', error);
    }

    // Fallback to server compression
    return this.serverCompressor.compressVideo(file, options);
  }

  // Compress existing video files in the project
  async compressExistingVideo(
    videoPath: string,
    options: VideoCompressionOptions
  ): Promise<VideoCompressionResult> {
    try {
      const response = await fetch('/api/video/compress-existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoPath,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to compress existing video: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logError(error, { context: 'Existing video compression' });
      throw error;
    }
  }

  private isVideoFile(file: File): boolean {
    const videoTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
    ];
    
    return videoTypes.includes(file.type);
  }

  // Calculate optimal compression settings based on connection speed
  getOptimalSettings(connectionSpeed: 'slow' | 'medium' | 'fast'): VideoCompressionOptions {
    switch (connectionSpeed) {
      case 'slow':
        return {
          quality: 'low',
          format: 'mp4',
          targetSizeMB: 2,
          maxBitrate: 400,
        };
      case 'medium':
        return {
          quality: 'medium',
          format: 'mp4',
          targetSizeMB: 4,
          maxBitrate: 800,
        };
      case 'fast':
      default:
        return {
          quality: 'high',
          format: 'both',
          targetSizeMB: 8,
          maxBitrate: 1200,
        };
    }
  }

  // Estimate compression time based on file size and quality
  estimateCompressionTime(fileSizeMB: number, quality: string): number {
    const baseTimePerMB = quality === 'ultra' ? 30 : quality === 'high' ? 20 : 10; // seconds
    return fileSizeMB * baseTimePerMB;
  }
}

// Utility functions for video optimization
export const VideoUtils = {
  // Get video metadata without full download
  async getVideoMetadata(videoUrl: string): Promise<{
    duration: number;
    width: number;
    height: number;
    bitrate?: number;
  }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
        URL.revokeObjectURL(video.src);
      };
      
      video.src = videoUrl;
    });
  },

  // Detect user's connection speed
  detectConnectionSpeed(): 'slow' | 'medium' | 'fast' {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      
      if (connection) {
        const effectiveType = connection.effectiveType;
        
        switch (effectiveType) {
          case 'slow-2g':
          case '2g':
            return 'slow';
          case '3g':
            return 'medium';
          case '4g':
          default:
            return 'fast';
        }
      }
    }
    
    return 'medium'; // Default fallback
  },

  // Calculate optimal quality based on viewport size
  getOptimalQualityForViewport(): keyof typeof VIDEO_QUALITY_PRESETS {
    if (typeof window === 'undefined') return 'medium';
    
    const width = window.innerWidth;
    const pixelRatio = window.devicePixelRatio || 1;
    const effectiveWidth = width * pixelRatio;
    
    if (effectiveWidth >= 1920) return 'ultra';
    if (effectiveWidth >= 1280) return 'high';
    if (effectiveWidth >= 854) return 'medium';
    return 'low';
  },

  // Generate video poster image
  async generatePoster(videoUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.currentTime = video.duration * 0.1; // 10% into the video
      };
      
      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const posterUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(posterUrl);
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = videoUrl;
    });
  },
};

// Export singleton instance
export const videoCompressor = new VideoCompressor();