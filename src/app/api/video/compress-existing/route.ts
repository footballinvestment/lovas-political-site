// src/app/api/video/compress-existing/route.ts
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
import { VIDEO_QUALITY_PRESETS, VideoCompressionOptions } from '@/lib/video-compression';

// Compress the existing 22MB video file
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

      const body = await request.json();
      const { videoPath, options = { quality: 'medium', format: 'mp4' } } = body;

      if (!videoPath) {
        return NextResponse.json(
          { error: 'Video path required' },
          { status: 400 }
        );
      }

      // Resolve full path
      const fullPath = path.resolve(process.cwd(), 'public', videoPath.replace(/^\//, ''));
      
      // Check if file exists
      try {
        await fs.access(fullPath);
      } catch (error) {
        return NextResponse.json(
          { error: 'Video file not found' },
          { status: 404 }
        );
      }

      // Get original file size
      const stats = await fs.stat(fullPath);
      const originalSizeMB = stats.size / (1024 * 1024);

      console.log(`[Video Compression] Starting compression of ${videoPath} (${originalSizeMB.toFixed(2)}MB)`);

      // Create output directory for compressed videos
      const outputDir = path.join(process.cwd(), 'public', 'uploads', 'compressed');
      await fs.mkdir(outputDir, { recursive: true });

      // Generate compressed variants
      const variants = await generateVideoVariants(fullPath, outputDir, options);

      // Calculate compression results
      const totalCompressedSize = variants.reduce((sum, variant) => sum + variant.size, 0);
      const compressionRatio = stats.size / totalCompressedSize;
      const savedSpace = stats.size - totalCompressedSize;
      const savedSpaceMB = savedSpace / (1024 * 1024);

      await logAPIError(
        new Error(`Video compression completed: ${videoPath}`),
        {
          context: 'Video compression success',
          originalSize: stats.size,
          compressedSize: totalCompressedSize,
          compressionRatio,
          savedSpaceMB,
          variants: variants.length,
          severity: 'info',
        }
      );

      return NextResponse.json({
        success: true,
        originalSize: stats.size,
        originalSizeMB: originalSizeMB,
        variants,
        compressionRatio,
        savedSpaceMB,
        message: `Successfully compressed video. Saved ${savedSpaceMB.toFixed(2)}MB (${((savedSpace / stats.size) * 100).toFixed(1)}% reduction)`,
      });

    } catch (error) {
      await logAPIError(error, {
        context: 'Video compression API',
        endpoint: '/api/video/compress-existing',
      });

      return NextResponse.json(
        { 
          error: 'Failed to compress video',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}

async function generateVideoVariants(
  inputPath: string,
  outputDir: string,
  options: VideoCompressionOptions
) {
  const variants = [];
  const inputName = path.parse(inputPath).name;

  // Determine which qualities to generate
  const qualitiesToGenerate = getQualitiesToGenerate(options.quality);

  for (const quality of qualitiesToGenerate) {
    const preset = VIDEO_QUALITY_PRESETS[quality];
    
    // Generate both MP4 and WebM if requested
    const formats = options.format === 'both' ? ['mp4', 'webm'] : [options.format || 'mp4'];
    
    for (const format of formats) {
      const outputFileName = `${inputName}${preset.suffix}.${format}`;
      const outputPath = path.join(outputDir, outputFileName);
      
      try {
        await compressVideo(inputPath, outputPath, preset, format);
        
        // Get file stats
        const stats = await fs.stat(outputPath);
        const sizeMB = stats.size / (1024 * 1024);
        
        variants.push({
          quality,
          format,
          bitrate: preset.bitrate,
          resolution: preset.resolution,
          url: `/uploads/compressed/${outputFileName}`,
          size: stats.size,
          sizeMB: sizeMB,
          filename: outputFileName,
        });
        
        console.log(`[Video Compression] Generated ${quality} ${format}: ${sizeMB.toFixed(2)}MB`);
        
      } catch (error) {
        console.error(`[Video Compression] Failed to generate ${quality} ${format}:`, error);
      }
    }
  }

  return variants;
}

function getQualitiesToGenerate(targetQuality: string): (keyof typeof VIDEO_QUALITY_PRESETS)[] {
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

function compressVideo(
  inputPath: string,
  outputPath: string,
  preset: typeof VIDEO_QUALITY_PRESETS[keyof typeof VIDEO_QUALITY_PRESETS],
  format: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Build FFmpeg arguments based on format
    const baseArgs = [
      '-i', inputPath,
      '-preset', 'fast',
      '-crf', '23',
      '-maxrate', `${preset.bitrate}k`,
      '-bufsize', `${preset.bitrate * 2}k`,
      '-vf', `scale=${preset.resolution.width}:${preset.resolution.height}`,
      '-r', preset.framerate.toString(),
      '-movflags', '+faststart',
      '-y',
    ];

    let args: string[];
    
    if (format === 'webm') {
      args = [
        ...baseArgs.slice(0, 2), // -i inputPath
        '-c:v', 'libvpx-vp9',
        '-c:a', 'libopus',
        '-b:a', '128k',
        ...baseArgs.slice(2, -2), // Other args except -movflags and -y
        '-deadline', 'good',
        '-cpu-used', '2',
        '-y',
        outputPath
      ];
    } else {
      args = [
        ...baseArgs.slice(0, 2), // -i inputPath
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:a', '128k',
        ...baseArgs.slice(2),
        outputPath
      ];
    }

    console.log(`[FFmpeg] Starting compression: ${format} ${preset.resolution.width}x${preset.resolution.height}`);
    
    const ffmpeg = spawn('ffmpeg', args);
    
    let errorOutput = '';
    
    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(`[FFmpeg] Completed: ${path.basename(outputPath)}`);
        resolve();
      } else {
        console.error(`[FFmpeg] Failed with code ${code}:`, errorOutput);
        reject(new Error(`FFmpeg failed with code ${code}: ${errorOutput}`));
      }
    });
    
    ffmpeg.on('error', (error) => {
      console.error(`[FFmpeg] Process error:`, error);
      reject(error);
    });
  });
}

// GET: List available compressed videos
export async function GET() {
  try {
    const compressedDir = path.join(process.cwd(), 'public', 'uploads', 'compressed');
    
    try {
      const files = await fs.readdir(compressedDir);
      const videoFiles = files.filter(file => 
        file.endsWith('.mp4') || file.endsWith('.webm')
      );
      
      const videos = [];
      
      for (const file of videoFiles) {
        const filePath = path.join(compressedDir, file);
        const stats = await fs.stat(filePath);
        
        videos.push({
          filename: file,
          url: `/uploads/compressed/${file}`,
          size: stats.size,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          createdAt: stats.birthtime,
        });
      }
      
      return NextResponse.json({
        videos,
        count: videos.length,
      });
      
    } catch (error) {
      // Directory doesn't exist
      return NextResponse.json({
        videos: [],
        count: 0,
      });
    }
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to list compressed videos' },
      { status: 500 }
    );
  }
}