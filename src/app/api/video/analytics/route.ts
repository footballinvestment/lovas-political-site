// src/app/api/video/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { withRateLimit } from '@/lib/rate-limit';
import { logAPIError } from '@/lib/error-logger';

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

interface AnalyticsData {
  events: VideoAnalyticsEvent[];
  timestamp: number;
  clientIP?: string;
  userAgent?: string;
}

// POST: Receive analytics events
export async function POST(request: NextRequest) {
  return withRateLimit('analytics', async () => {
    try {
      const body = await request.json();
      const { events } = body;

      if (!events || !Array.isArray(events)) {
        return NextResponse.json(
          { error: 'Invalid events data' },
          { status: 400 }
        );
      }

      // Validate events
      const validEvents = events.filter(event => 
        event.eventType && 
        event.videoId && 
        event.timestamp && 
        typeof event.currentTime === 'number'
      );

      if (validEvents.length === 0) {
        return NextResponse.json(
          { error: 'No valid events provided' },
          { status: 400 }
        );
      }

      // Prepare analytics data
      const analyticsData: AnalyticsData = {
        events: validEvents,
        timestamp: Date.now(),
        clientIP: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
      };

      // Store analytics data
      await storeAnalyticsData(analyticsData);

      // Log successful analytics collection
      console.log(`[Video Analytics] Received ${validEvents.length} events`);

      return NextResponse.json({
        success: true,
        eventsReceived: validEvents.length,
        message: 'Analytics events recorded successfully',
      });

    } catch (error) {
      await logAPIError(error, {
        context: 'Video analytics API',
        endpoint: '/api/video/analytics',
      });

      return NextResponse.json(
        { 
          error: 'Failed to process analytics data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}

// GET: Retrieve analytics data (admin only)
export async function GET(request: NextRequest) {
  return withRateLimit('admin', async () => {
    try {
      const { searchParams } = new URL(request.url);
      const videoId = searchParams.get('videoId');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const eventType = searchParams.get('eventType');
      const format = searchParams.get('format') || 'json';

      // Load analytics data
      const analyticsData = await loadAnalyticsData({
        videoId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        eventType: eventType as any,
      });

      // Generate metrics
      const metrics = generateMetrics(analyticsData);

      if (format === 'csv') {
        const csv = convertToCSV(analyticsData);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="video-analytics-${Date.now()}.csv"`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: analyticsData,
        metrics,
        summary: {
          totalEvents: analyticsData.length,
          dateRange: {
            start: startDate,
            end: endDate,
          },
          filters: {
            videoId,
            eventType,
          },
        },
      });

    } catch (error) {
      await logAPIError(error, {
        context: 'Video analytics retrieval API',
        endpoint: '/api/video/analytics',
      });

      return NextResponse.json(
        { 
          error: 'Failed to retrieve analytics data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}

async function storeAnalyticsData(data: AnalyticsData): Promise<void> {
  try {
    // Create analytics directory if it doesn't exist
    const analyticsDir = path.join(process.cwd(), 'data', 'analytics');
    await fs.mkdir(analyticsDir, { recursive: true });

    // Create daily file
    const date = new Date().toISOString().split('T')[0];
    const filename = `video-analytics-${date}.jsonl`;
    const filepath = path.join(analyticsDir, filename);

    // Append data as JSON lines
    const jsonLine = JSON.stringify(data) + '\n';
    await fs.appendFile(filepath, jsonLine, 'utf8');

    // Also maintain a rolling log for recent events
    const recentFilepath = path.join(analyticsDir, 'recent-events.jsonl');
    await fs.appendFile(recentFilepath, jsonLine, 'utf8');

    // Keep only last 1000 lines in recent events
    await trimRecentEvents(recentFilepath);

  } catch (error) {
    console.error('Failed to store analytics data:', error);
    throw error;
  }
}

async function loadAnalyticsData(filters: {
  videoId?: string | null;
  startDate?: Date;
  endDate?: Date;
  eventType?: string | null;
}): Promise<VideoAnalyticsEvent[]> {
  try {
    const analyticsDir = path.join(process.cwd(), 'data', 'analytics');
    
    // Get list of analytics files
    const files = await fs.readdir(analyticsDir);
    const analyticsFiles = files.filter(file => file.startsWith('video-analytics-') && file.endsWith('.jsonl'));

    let allEvents: VideoAnalyticsEvent[] = [];

    // Read and parse all relevant files
    for (const file of analyticsFiles) {
      const filepath = path.join(analyticsDir, file);
      const content = await fs.readFile(filepath, 'utf8');
      
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data: AnalyticsData = JSON.parse(line);
          allEvents.push(...data.events);
        } catch (parseError) {
          console.warn('Failed to parse analytics line:', parseError);
        }
      }
    }

    // Apply filters
    let filteredEvents = allEvents;

    if (filters.videoId) {
      filteredEvents = filteredEvents.filter(event => event.videoId === filters.videoId);
    }

    if (filters.eventType) {
      filteredEvents = filteredEvents.filter(event => event.eventType === filters.eventType);
    }

    if (filters.startDate) {
      const startTime = filters.startDate.getTime();
      filteredEvents = filteredEvents.filter(event => event.timestamp >= startTime);
    }

    if (filters.endDate) {
      const endTime = filters.endDate.getTime();
      filteredEvents = filteredEvents.filter(event => event.timestamp <= endTime);
    }

    // Sort by timestamp
    filteredEvents.sort((a, b) => a.timestamp - b.timestamp);

    return filteredEvents;

  } catch (error) {
    console.error('Failed to load analytics data:', error);
    return [];
  }
}

function generateMetrics(events: VideoAnalyticsEvent[]) {
  const totalEvents = events.length;
  
  if (totalEvents === 0) {
    return {
      totalEvents: 0,
      uniqueVideos: 0,
      uniqueSessions: 0,
      eventTypeDistribution: {},
      qualityDistribution: {},
      deviceDistribution: {},
      errorRate: 0,
      averageWatchTime: 0,
    };
  }

  // Event type distribution
  const eventTypeDistribution: Record<string, number> = {};
  events.forEach(event => {
    eventTypeDistribution[event.eventType] = (eventTypeDistribution[event.eventType] || 0) + 1;
  });

  // Quality distribution
  const qualityDistribution: Record<string, number> = {};
  events.forEach(event => {
    if (event.quality) {
      qualityDistribution[event.quality] = (qualityDistribution[event.quality] || 0) + 1;
    }
  });

  // Device distribution
  const deviceDistribution = { desktop: 0, mobile: 0, tablet: 0 };
  events.forEach(event => {
    if (event.deviceInfo?.userAgent) {
      const userAgent = event.deviceInfo.userAgent;
      if (/Mobile|Android|iPhone/i.test(userAgent)) {
        deviceDistribution.mobile++;
      } else if (/Tablet|iPad/i.test(userAgent)) {
        deviceDistribution.tablet++;
      } else {
        deviceDistribution.desktop++;
      }
    }
  });

  // Error rate
  const errorEvents = events.filter(event => event.eventType === 'error').length;
  const errorRate = (errorEvents / totalEvents) * 100;

  // Average watch time (approximate from progress events)
  const progressEvents = events.filter(event => event.eventType === 'progress');
  const avgWatchTime = progressEvents.length > 0
    ? progressEvents.reduce((sum, event) => sum + event.currentTime, 0) / progressEvents.length
    : 0;

  // Unique counts
  const uniqueVideos = new Set(events.map(event => event.videoId)).size;
  const uniqueSessions = new Set(events.map(event => event.sessionId)).size;

  return {
    totalEvents,
    uniqueVideos,
    uniqueSessions,
    eventTypeDistribution,
    qualityDistribution,
    deviceDistribution,
    errorRate,
    averageWatchTime,
  };
}

function convertToCSV(events: VideoAnalyticsEvent[]): string {
  if (events.length === 0) {
    return 'No data available';
  }

  // CSV headers
  const headers = [
    'timestamp',
    'eventType',
    'videoId',
    'sessionId',
    'currentTime',
    'duration',
    'quality',
    'bitrate',
    'bufferHealth',
    'networkSpeed',
    'userAgent',
    'viewport',
  ];

  // Convert events to CSV rows
  const rows = events.map(event => [
    new Date(event.timestamp).toISOString(),
    event.eventType,
    event.videoId,
    event.sessionId,
    event.currentTime,
    event.duration,
    event.quality || '',
    event.bitrate || '',
    event.bufferHealth || '',
    event.networkSpeed || '',
    event.deviceInfo?.userAgent || '',
    event.deviceInfo?.viewport ? `${event.deviceInfo.viewport.width}x${event.deviceInfo.viewport.height}` : '',
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}

async function trimRecentEvents(filepath: string): Promise<void> {
  try {
    const content = await fs.readFile(filepath, 'utf8');
    const lines = content.trim().split('\n');
    
    if (lines.length > 1000) {
      const recentLines = lines.slice(-1000);
      await fs.writeFile(filepath, recentLines.join('\n') + '\n', 'utf8');
    }
  } catch (error) {
    // File might not exist yet, which is fine
    console.warn('Could not trim recent events file:', error);
  }
}

function getClientIP(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return undefined;
}