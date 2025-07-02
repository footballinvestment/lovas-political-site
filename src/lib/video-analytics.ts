// src/lib/video-analytics.ts
"use client";

interface VideoAnalyticsEvent {
  eventType: 'play' | 'pause' | 'seek' | 'ended' | 'error' | 'qualityChange' | 'bufferStart' | 'bufferEnd' | 'load' | 'progress';
  videoId: string;
  videoSrc: string;
  timestamp: number;
  currentTime: number;
  duration: number;
  quality?: string;
  bitrate?: number;
  bufferHealth?: number;
  networkSpeed?: string;
  deviceInfo?: {
    userAgent: string;
    viewport: { width: number; height: number };
    connection?: string;
  };
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface VideoSession {
  sessionId: string;
  videoId: string;
  startTime: number;
  endTime?: number;
  totalWatchTime: number;
  events: VideoAnalyticsEvent[];
  qualityChanges: number;
  bufferEvents: number;
  seekEvents: number;
  completionRate: number;
  avgBufferHealth: number;
  peakQuality: string;
  deviceInfo: VideoAnalyticsEvent['deviceInfo'];
}

interface AnalyticsMetrics {
  totalViews: number;
  totalWatchTime: number;
  averageWatchTime: number;
  completionRate: number;
  qualityDistribution: Record<string, number>;
  bufferHealthStats: {
    average: number;
    poor: number; // < 30%
    good: number; // 30-70%
    excellent: number; // > 70%
  };
  deviceStats: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  networkStats: Record<string, number>;
  errorRate: number;
  popularVideos: Array<{ videoId: string; views: number; watchTime: number }>;
}

class VideoAnalytics {
  private events: VideoAnalyticsEvent[] = [];
  private sessions: Map<string, VideoSession> = new Map();
  private currentSession: VideoSession | null = null;
  private sessionId: string;
  private batchSize = 10;
  private batchTimeout = 30000; // 30 seconds
  private pendingEvents: VideoAnalyticsEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isOnline = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupNetworkMonitoring();
    this.setupUnloadHandler();
    this.setupPerformanceObserver();
  }

  /**
   * Start tracking a video session
   */
  startSession(videoId: string, videoSrc: string): void {
    this.endCurrentSession();

    const session: VideoSession = {
      sessionId: this.sessionId,
      videoId,
      startTime: Date.now(),
      totalWatchTime: 0,
      events: [],
      qualityChanges: 0,
      bufferEvents: 0,
      seekEvents: 0,
      completionRate: 0,
      avgBufferHealth: 100,
      peakQuality: 'medium',
      deviceInfo: this.getDeviceInfo(),
    };

    this.currentSession = session;
    this.sessions.set(this.sessionId, session);

    // Track initial load event
    this.trackEvent('load', videoId, videoSrc, {
      currentTime: 0,
      duration: 0,
    });
  }

  /**
   * Track a video event
   */
  trackEvent(
    eventType: VideoAnalyticsEvent['eventType'],
    videoId: string,
    videoSrc: string,
    data: {
      currentTime: number;
      duration: number;
      quality?: string;
      bitrate?: number;
      bufferHealth?: number;
      networkSpeed?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    const event: VideoAnalyticsEvent = {
      eventType,
      videoId,
      videoSrc,
      timestamp: Date.now(),
      currentTime: data.currentTime,
      duration: data.duration,
      quality: data.quality,
      bitrate: data.bitrate,
      bufferHealth: data.bufferHealth,
      networkSpeed: data.networkSpeed,
      deviceInfo: this.getDeviceInfo(),
      sessionId: this.sessionId,
      metadata: data.metadata,
    };

    this.events.push(event);
    this.updateSession(event);
    this.addToBatch(event);

    // Immediate send for critical events
    if (eventType === 'error' || eventType === 'ended') {
      this.sendBatch();
    }
  }

  /**
   * Track video progress
   */
  trackProgress(
    videoId: string,
    videoSrc: string,
    currentTime: number,
    duration: number,
    bufferHealth: number,
    quality: string
  ): void {
    // Only track progress every 10 seconds to avoid spam
    if (Math.floor(currentTime) % 10 === 0) {
      this.trackEvent('progress', videoId, videoSrc, {
        currentTime,
        duration,
        bufferHealth,
        quality,
      });
    }
  }

  /**
   * Track quality change
   */
  trackQualityChange(
    videoId: string,
    videoSrc: string,
    currentTime: number,
    duration: number,
    fromQuality: string,
    toQuality: string
  ): void {
    this.trackEvent('qualityChange', videoId, videoSrc, {
      currentTime,
      duration,
      quality: toQuality,
      metadata: { fromQuality, toQuality },
    });

    if (this.currentSession) {
      this.currentSession.qualityChanges++;
      this.updatePeakQuality(toQuality);
    }
  }

  /**
   * Track buffering events
   */
  trackBufferEvent(
    eventType: 'bufferStart' | 'bufferEnd',
    videoId: string,
    videoSrc: string,
    currentTime: number,
    duration: number,
    bufferHealth: number
  ): void {
    this.trackEvent(eventType, videoId, videoSrc, {
      currentTime,
      duration,
      bufferHealth,
    });

    if (this.currentSession && eventType === 'bufferStart') {
      this.currentSession.bufferEvents++;
    }
  }

  /**
   * End current session
   */
  endCurrentSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession.completionRate = this.calculateCompletionRate();
      this.currentSession.avgBufferHealth = this.calculateAvgBufferHealth();
      
      // Send final session data
      this.sendSessionData(this.currentSession);
      this.currentSession = null;
    }
  }

  /**
   * Get analytics metrics
   */
  getMetrics(): AnalyticsMetrics {
    const sessions = Array.from(this.sessions.values());
    
    return {
      totalViews: sessions.length,
      totalWatchTime: sessions.reduce((sum, s) => sum + s.totalWatchTime, 0),
      averageWatchTime: sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + s.totalWatchTime, 0) / sessions.length 
        : 0,
      completionRate: sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.completionRate, 0) / sessions.length
        : 0,
      qualityDistribution: this.getQualityDistribution(),
      bufferHealthStats: this.getBufferHealthStats(),
      deviceStats: this.getDeviceStats(),
      networkStats: this.getNetworkStats(),
      errorRate: this.getErrorRate(),
      popularVideos: this.getPopularVideos(),
    };
  }

  /**
   * Export analytics data
   */
  exportData(): {
    events: VideoAnalyticsEvent[];
    sessions: VideoSession[];
    metrics: AnalyticsMetrics;
  } {
    return {
      events: this.events,
      sessions: Array.from(this.sessions.values()),
      metrics: this.getMetrics(),
    };
  }

  /**
   * Clear analytics data
   */
  clearData(): void {
    this.events = [];
    this.sessions.clear();
    this.currentSession = null;
    this.pendingEvents = [];
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): VideoAnalyticsEvent['deviceInfo'] {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const connection = 'connection' in navigator 
      ? (navigator as any).connection?.effectiveType 
      : undefined;

    return {
      userAgent: navigator.userAgent,
      viewport,
      connection,
    };
  }

  private updateSession(event: VideoAnalyticsEvent): void {
    if (!this.currentSession) return;

    this.currentSession.events.push(event);

    // Update watch time for play/pause events
    if (event.eventType === 'play' || event.eventType === 'pause') {
      this.updateWatchTime();
    }

    // Update seek count
    if (event.eventType === 'seek') {
      this.currentSession.seekEvents++;
    }
  }

  private updateWatchTime(): void {
    if (!this.currentSession) return;

    const playEvents = this.currentSession.events.filter(e => e.eventType === 'play');
    const pauseEvents = this.currentSession.events.filter(e => e.eventType === 'pause');

    let watchTime = 0;
    let lastPlayTime = 0;

    this.currentSession.events.forEach(event => {
      if (event.eventType === 'play') {
        lastPlayTime = event.timestamp;
      } else if (event.eventType === 'pause' && lastPlayTime > 0) {
        watchTime += event.timestamp - lastPlayTime;
        lastPlayTime = 0;
      }
    });

    // Add current session time if still playing
    if (lastPlayTime > 0) {
      watchTime += Date.now() - lastPlayTime;
    }

    this.currentSession.totalWatchTime = watchTime;
  }

  private updatePeakQuality(quality: string): void {
    if (!this.currentSession) return;

    const qualityOrder = { low: 0, medium: 1, high: 2, ultra: 3 };
    const currentPeak = qualityOrder[this.currentSession.peakQuality as keyof typeof qualityOrder] || 1;
    const newQuality = qualityOrder[quality as keyof typeof qualityOrder] || 1;

    if (newQuality > currentPeak) {
      this.currentSession.peakQuality = quality;
    }
  }

  private calculateCompletionRate(): number {
    if (!this.currentSession) return 0;

    const endEvents = this.currentSession.events.filter(e => e.eventType === 'ended');
    if (endEvents.length === 0) return 0;

    const lastEvent = endEvents[endEvents.length - 1];
    return lastEvent.duration > 0 ? (lastEvent.currentTime / lastEvent.duration) * 100 : 0;
  }

  private calculateAvgBufferHealth(): number {
    if (!this.currentSession) return 100;

    const progressEvents = this.currentSession.events.filter(e => 
      e.eventType === 'progress' && e.bufferHealth !== undefined
    );

    if (progressEvents.length === 0) return 100;

    const totalHealth = progressEvents.reduce((sum, e) => sum + (e.bufferHealth || 0), 0);
    return totalHealth / progressEvents.length;
  }

  private addToBatch(event: VideoAnalyticsEvent): void {
    this.pendingEvents.push(event);

    if (this.pendingEvents.length >= this.batchSize) {
      this.sendBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.sendBatch();
      }, this.batchTimeout);
    }
  }

  private async sendBatch(): Promise<void> {
    if (this.pendingEvents.length === 0 || !this.isOnline) return;

    const events = [...this.pendingEvents];
    this.pendingEvents = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      await fetch('/api/video/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      console.warn('Failed to send analytics batch:', error);
      // Re-queue events for retry
      this.pendingEvents.unshift(...events);
    }
  }

  private async sendSessionData(session: VideoSession): Promise<void> {
    if (!this.isOnline) return;

    try {
      await fetch('/api/video/analytics/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session }),
      });
    } catch (error) {
      console.warn('Failed to send session data:', error);
    }
  }

  private getQualityDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    this.events.forEach(event => {
      if (event.quality) {
        distribution[event.quality] = (distribution[event.quality] || 0) + 1;
      }
    });

    return distribution;
  }

  private getBufferHealthStats() {
    const healthValues = this.events
      .filter(e => e.bufferHealth !== undefined)
      .map(e => e.bufferHealth!);

    if (healthValues.length === 0) {
      return { average: 100, poor: 0, good: 0, excellent: 0 };
    }

    const average = healthValues.reduce((sum, val) => sum + val, 0) / healthValues.length;
    const poor = healthValues.filter(val => val < 30).length;
    const good = healthValues.filter(val => val >= 30 && val <= 70).length;
    const excellent = healthValues.filter(val => val > 70).length;

    return { average, poor, good, excellent };
  }

  private getDeviceStats() {
    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    
    Array.from(this.sessions.values()).forEach(session => {
      const userAgent = session.deviceInfo?.userAgent || '';
      if (/Mobile|Android|iPhone/i.test(userAgent)) {
        devices.mobile++;
      } else if (/Tablet|iPad/i.test(userAgent)) {
        devices.tablet++;
      } else {
        devices.desktop++;
      }
    });

    return devices;
  }

  private getNetworkStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    this.events.forEach(event => {
      if (event.networkSpeed) {
        stats[event.networkSpeed] = (stats[event.networkSpeed] || 0) + 1;
      }
    });

    return stats;
  }

  private getErrorRate(): number {
    const totalEvents = this.events.length;
    const errorEvents = this.events.filter(e => e.eventType === 'error').length;
    
    return totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;
  }

  private getPopularVideos(): Array<{ videoId: string; views: number; watchTime: number }> {
    const videoStats = new Map<string, { views: number; watchTime: number }>();
    
    Array.from(this.sessions.values()).forEach(session => {
      const existing = videoStats.get(session.videoId) || { views: 0, watchTime: 0 };
      videoStats.set(session.videoId, {
        views: existing.views + 1,
        watchTime: existing.watchTime + session.totalWatchTime,
      });
    });

    return Array.from(videoStats.entries())
      .map(([videoId, stats]) => ({ videoId, ...stats }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }

  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.pendingEvents.length > 0) {
        this.sendBatch();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private setupUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.endCurrentSession();
      if (this.pendingEvents.length > 0) {
        // Use sendBeacon for reliable data transmission on unload
        navigator.sendBeacon('/api/video/analytics', JSON.stringify({
          events: this.pendingEvents,
        }));
      }
    });
  }

  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'resource' && entry.name.includes('.mp4')) {
              // Track video loading performance
              this.trackEvent('load', 'unknown', entry.name, {
                currentTime: 0,
                duration: 0,
                metadata: {
                  loadTime: entry.duration,
                  transferSize: (entry as any).transferSize,
                },
              });
            }
          });
        });
        
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }
}

// Global instance
let analyticsInstance: VideoAnalytics | null = null;

export const getVideoAnalytics = (): VideoAnalytics => {
  if (!analyticsInstance) {
    analyticsInstance = new VideoAnalytics();
  }
  return analyticsInstance;
};

export type { VideoAnalyticsEvent, VideoSession, AnalyticsMetrics };
export { VideoAnalytics };