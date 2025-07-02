// src/app/api/video/analytics/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { withRateLimit } from '@/lib/rate-limit';
import { logAPIError } from '@/lib/error-logger';

interface VideoSession {
  sessionId: string;
  videoId: string;
  startTime: number;
  endTime?: number;
  totalWatchTime: number;
  events: any[];
  qualityChanges: number;
  bufferEvents: number;
  seekEvents: number;
  completionRate: number;
  avgBufferHealth: number;
  peakQuality: string;
  deviceInfo: any;
}

interface SessionData {
  session: VideoSession;
  timestamp: number;
  clientIP?: string;
  userAgent?: string;
}

// POST: Receive session data
export async function POST(request: NextRequest) {
  return withRateLimit('analytics', async () => {
    try {
      const body = await request.json();
      const { session } = body;

      if (!session || !session.sessionId || !session.videoId) {
        return NextResponse.json(
          { error: 'Invalid session data' },
          { status: 400 }
        );
      }

      // Prepare session data
      const sessionData: SessionData = {
        session,
        timestamp: Date.now(),
        clientIP: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
      };

      // Store session data
      await storeSessionData(sessionData);

      // Log successful session recording
      console.log(`[Video Analytics] Session recorded: ${session.sessionId} for video: ${session.videoId}`);

      return NextResponse.json({
        success: true,
        sessionId: session.sessionId,
        message: 'Session data recorded successfully',
      });

    } catch (error) {
      await logAPIError(error, {
        context: 'Video analytics session API',
        endpoint: '/api/video/analytics/session',
      });

      return NextResponse.json(
        { 
          error: 'Failed to process session data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}

// GET: Retrieve session data
export async function GET(request: NextRequest) {
  return withRateLimit('admin', async () => {
    try {
      const { searchParams } = new URL(request.url);
      const sessionId = searchParams.get('sessionId');
      const videoId = searchParams.get('videoId');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      // Load session data
      const sessions = await loadSessionData({
        sessionId,
        videoId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      // Generate session metrics
      const metrics = generateSessionMetrics(sessions);

      return NextResponse.json({
        success: true,
        sessions,
        metrics,
        summary: {
          totalSessions: sessions.length,
          dateRange: {
            start: startDate,
            end: endDate,
          },
          filters: {
            sessionId,
            videoId,
          },
        },
      });

    } catch (error) {
      await logAPIError(error, {
        context: 'Video analytics session retrieval API',
        endpoint: '/api/video/analytics/session',
      });

      return NextResponse.json(
        { 
          error: 'Failed to retrieve session data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}

async function storeSessionData(data: SessionData): Promise<void> {
  try {
    // Create sessions directory if it doesn't exist
    const sessionsDir = path.join(process.cwd(), 'data', 'sessions');
    await fs.mkdir(sessionsDir, { recursive: true });

    // Create daily file
    const date = new Date().toISOString().split('T')[0];
    const filename = `video-sessions-${date}.jsonl`;
    const filepath = path.join(sessionsDir, filename);

    // Append data as JSON lines
    const jsonLine = JSON.stringify(data) + '\n';
    await fs.appendFile(filepath, jsonLine, 'utf8');

    // Also store individual session file for quick access
    const sessionFilepath = path.join(sessionsDir, `session-${data.session.sessionId}.json`);
    await fs.writeFile(sessionFilepath, JSON.stringify(data, null, 2), 'utf8');

  } catch (error) {
    console.error('Failed to store session data:', error);
    throw error;
  }
}

async function loadSessionData(filters: {
  sessionId?: string | null;
  videoId?: string | null;
  startDate?: Date;
  endDate?: Date;
}): Promise<VideoSession[]> {
  try {
    const sessionsDir = path.join(process.cwd(), 'data', 'sessions');
    
    // If specific session requested, try to load it directly
    if (filters.sessionId) {
      try {
        const sessionFilepath = path.join(sessionsDir, `session-${filters.sessionId}.json`);
        const content = await fs.readFile(sessionFilepath, 'utf8');
        const data: SessionData = JSON.parse(content);
        return [data.session];
      } catch (error) {
        // Fall through to search in daily files
      }
    }

    // Get list of session files
    const files = await fs.readdir(sessionsDir);
    const sessionFiles = files.filter(file => file.startsWith('video-sessions-') && file.endsWith('.jsonl'));

    let allSessions: VideoSession[] = [];

    // Read and parse all relevant files
    for (const file of sessionFiles) {
      const filepath = path.join(sessionsDir, file);
      const content = await fs.readFile(filepath, 'utf8');
      
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data: SessionData = JSON.parse(line);
          allSessions.push(data.session);
        } catch (parseError) {
          console.warn('Failed to parse session line:', parseError);
        }
      }
    }

    // Apply filters
    let filteredSessions = allSessions;

    if (filters.sessionId) {
      filteredSessions = filteredSessions.filter(session => session.sessionId === filters.sessionId);
    }

    if (filters.videoId) {
      filteredSessions = filteredSessions.filter(session => session.videoId === filters.videoId);
    }

    if (filters.startDate) {
      const startTime = filters.startDate.getTime();
      filteredSessions = filteredSessions.filter(session => session.startTime >= startTime);
    }

    if (filters.endDate) {
      const endTime = filters.endDate.getTime();
      filteredSessions = filteredSessions.filter(session => session.startTime <= endTime);
    }

    // Sort by start time
    filteredSessions.sort((a, b) => a.startTime - b.startTime);

    return filteredSessions;

  } catch (error) {
    console.error('Failed to load session data:', error);
    return [];
  }
}

function generateSessionMetrics(sessions: VideoSession[]) {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      averageWatchTime: 0,
      averageCompletionRate: 0,
      averageBufferHealth: 0,
      qualityDistribution: {},
      deviceDistribution: {},
      sessionDurationDistribution: {},
    };
  }

  // Average watch time
  const totalWatchTime = sessions.reduce((sum, session) => sum + session.totalWatchTime, 0);
  const averageWatchTime = totalWatchTime / sessions.length;

  // Average completion rate
  const totalCompletionRate = sessions.reduce((sum, session) => sum + session.completionRate, 0);
  const averageCompletionRate = totalCompletionRate / sessions.length;

  // Average buffer health
  const totalBufferHealth = sessions.reduce((sum, session) => sum + session.avgBufferHealth, 0);
  const averageBufferHealth = totalBufferHealth / sessions.length;

  // Peak quality distribution
  const qualityDistribution: Record<string, number> = {};
  sessions.forEach(session => {
    qualityDistribution[session.peakQuality] = (qualityDistribution[session.peakQuality] || 0) + 1;
  });

  // Device distribution
  const deviceDistribution = { desktop: 0, mobile: 0, tablet: 0 };
  sessions.forEach(session => {
    if (session.deviceInfo?.userAgent) {
      const userAgent = session.deviceInfo.userAgent;
      if (/Mobile|Android|iPhone/i.test(userAgent)) {
        deviceDistribution.mobile++;
      } else if (/Tablet|iPad/i.test(userAgent)) {
        deviceDistribution.tablet++;
      } else {
        deviceDistribution.desktop++;
      }
    }
  });

  // Session duration distribution
  const sessionDurationDistribution = {
    short: 0,    // < 30 seconds
    medium: 0,   // 30s - 5 minutes
    long: 0,     // > 5 minutes
  };

  sessions.forEach(session => {
    const durationMinutes = session.totalWatchTime / (1000 * 60);
    if (durationMinutes < 0.5) {
      sessionDurationDistribution.short++;
    } else if (durationMinutes < 5) {
      sessionDurationDistribution.medium++;
    } else {
      sessionDurationDistribution.long++;
    }
  });

  return {
    totalSessions: sessions.length,
    averageWatchTime,
    averageCompletionRate,
    averageBufferHealth,
    qualityDistribution,
    deviceDistribution,
    sessionDurationDistribution,
  };
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