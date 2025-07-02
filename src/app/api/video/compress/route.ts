// src/app/api/video/compress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limit';
import { logAPIError } from '@/lib/error-logger';
import { validateCSRFMiddleware } from '@/lib/csrf';
import { VIDEO_QUALITY_PRESETS } from '@/lib/video-compression';

interface FFmpegJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  originalFile: string;
  outputFiles: string[];
  error?: string;
  startTime: number;
  endTime?: number;
}

// In-memory job tracking (use Redis in production)
const compressionJobs = new Map<string, FFmpegJob>();

// FFmpeg compression with multiple quality outputs
async function compressVideoWithFFmpeg(
  inputPath: string,
  outputDir: string,
  jobId: string,
  qualities: (keyof typeof VIDEO_QUALITY_PRESETS)[] = ['low', 'medium', 'high']
): Promise<string[]> {
  const outputFiles: string[] = [];
  
  for (const quality of qualities) {
    const preset = VIDEO_QUALITY_PRESETS[quality];
    const outputFile = path.join(
      outputDir, 
      `${path.parse(inputPath).name}${preset.suffix}.mp4`
    );
    
    outputFiles.push(outputFile);
    
    try {
      await runFFmpegCommand(inputPath, outputFile, preset, jobId);
      console.log(`[FFmpeg] Completed ${quality} quality for job ${jobId}`);
    } catch (error) {
      console.error(`[FFmpeg] Failed ${quality} quality for job ${jobId}:`, error);
      throw error;
    }
  }
  
  return outputFiles;
}

// Run FFmpeg command with progress tracking
function runFFmpegCommand(
  inputPath: string,
  outputPath: string,
  preset: typeof VIDEO_QUALITY_PRESETS[keyof typeof VIDEO_QUALITY_PRESETS],
  jobId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', inputPath,
      '-c:v', 'libx264',           // H.264 codec
      '-preset', 'fast',           // Encoding speed preset
      '-crf', '23',                // Constant Rate Factor (quality)
      '-maxrate', `${preset.bitrate}k`,  // Maximum bitrate
      '-bufsize', `${preset.bitrate * 2}k`, // Buffer size
      '-vf', `scale=${preset.resolution.width}:${preset.resolution.height}`, // Scale filter
      '-r', preset.framerate.toString(), // Frame rate
      '-c:a', 'aac',               // Audio codec
      '-b:a', '128k',              // Audio bitrate
      '-movflags', '+faststart',   // Optimize for web streaming
      '-y',                        // Overwrite output file
      outputPath
    ];

    const ffmpeg = spawn('ffmpeg', args);
    let duration = 0;

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      
      // Parse duration from FFmpeg output
      const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (durationMatch) {
        const [, hours, minutes, seconds] = durationMatch;
        duration = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
      }
      
      // Parse current time to calculate progress
      const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (timeMatch && duration > 0) {
        const [, hours, minutes, seconds] = timeMatch;
        const currentTime = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
        const progress = Math.min((currentTime / duration) * 100, 100);
        
        // Update job progress
        const job = compressionJobs.get(jobId);
        if (job) {
          job.progress = Math.round(progress);
          compressionJobs.set(jobId, job);
        }
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}

// Check if FFmpeg is available
async function checkFFmpegAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });
    
    ffmpeg.on('error', () => {
      resolve(false);
    });
  });
}

// POST: Start video compression
export async function POST(request: NextRequest) {
  return withRateLimit('admin', async () => {
    try {
      // Authentication check
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        );
      }

      // CSRF protection
      if (!validateCSRFMiddleware(request, session.user.id)) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }

      // Check FFmpeg availability
      const ffmpegAvailable = await checkFFmpegAvailability();
      if (!ffmpegAvailable) {
        return NextResponse.json(
          { error: 'FFmpeg not available on server' },
          { status: 500 }
        );
      }

      const formData = await request.formData();
      const videoFile = formData.get('video') as File;
      const optionsString = formData.get('options') as string;

      if (!videoFile) {
        return NextResponse.json(
          { error: 'No video file provided' },
          { status: 400 }
        );
      }

      const options = optionsString ? JSON.parse(optionsString) : { quality: 'medium' };
      const jobId = uuidv4();

      // Create temporary directories
      const tempDir = path.join(process.cwd(), 'temp', 'video-compression');
      const jobDir = path.join(tempDir, jobId);
      await fs.mkdir(jobDir, { recursive: true });

      // Save uploaded file
      const inputFileName = `input_${Date.now()}_${videoFile.name}`;
      const inputPath = path.join(jobDir, inputFileName);
      const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
      await fs.writeFile(inputPath, videoBuffer);

      // Create compression job
      const job: FFmpegJob = {
        id: jobId,
        status: 'pending',
        progress: 0,
        originalFile: inputPath,
        outputFiles: [],
        startTime: Date.now(),
      };

      compressionJobs.set(jobId, job);

      // Start compression asynchronously
      processVideoCompression(inputPath, jobDir, jobId, options)
        .catch((error) => {
          const failedJob = compressionJobs.get(jobId);
          if (failedJob) {
            failedJob.status = 'failed';
            failedJob.error = error.message;
            failedJob.endTime = Date.now();
            compressionJobs.set(jobId, failedJob);
          }
        });

      return NextResponse.json({
        jobId,
        status: 'pending',
        message: 'Video compression started',
      });

    } catch (error) {
      await logAPIError(error, {
        context: 'Video compression API',
        endpoint: '/api/video/compress',
      });

      return NextResponse.json(
        { error: 'Failed to start video compression' },
        { status: 500 }
      );
    }
  });
}

// Background compression processing
async function processVideoCompression(
  inputPath: string,
  outputDir: string,
  jobId: string,
  options: any
) {
  try {
    const job = compressionJobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    compressionJobs.set(jobId, job);

    // Determine qualities to generate based on options
    const qualities: (keyof typeof VIDEO_QUALITY_PRESETS)[] = 
      options.quality === 'ultra' ? ['low', 'medium', 'high', 'ultra'] :
      options.quality === 'high' ? ['low', 'medium', 'high'] :
      options.quality === 'medium' ? ['low', 'medium'] :
      ['low'];

    // Compress video with multiple qualities
    const outputFiles = await compressVideoWithFFmpeg(inputPath, outputDir, jobId, qualities);

    // Copy compressed files to public directory
    const publicDir = path.join(process.cwd(), 'public', 'uploads', 'compressed');
    await fs.mkdir(publicDir, { recursive: true });

    const publicFiles: string[] = [];
    for (const outputFile of outputFiles) {
      const fileName = path.basename(outputFile);
      const publicPath = path.join(publicDir, fileName);
      await fs.copyFile(outputFile, publicPath);
      publicFiles.push(`/uploads/compressed/${fileName}`);
    }

    // Update job status
    job.status = 'completed';
    job.progress = 100;
    job.outputFiles = publicFiles;
    job.endTime = Date.now();
    compressionJobs.set(jobId, job);

    // Cleanup temporary files
    setTimeout(async () => {
      try {
        await fs.rm(path.dirname(inputPath), { recursive: true, force: true });
      } catch (error) {
        console.error('Failed to cleanup temp files:', error);
      }
    }, 60000); // Cleanup after 1 minute

    console.log(`[FFmpeg] Compression completed for job ${jobId}`);

  } catch (error) {
    console.error(`[FFmpeg] Compression failed for job ${jobId}:`, error);
    
    const job = compressionJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.endTime = Date.now();
      compressionJobs.set(jobId, job);
    }
  }
}

// GET: Check compression status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID required' },
        { status: 400 }
      );
    }

    const job = compressionJobs.get(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      outputFiles: job.outputFiles,
      error: job.error,
      processingTime: job.endTime ? job.endTime - job.startTime : Date.now() - job.startTime,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}