#!/usr/bin/env node

// scripts/compress-all-videos.js
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Video compression configurations
const VIDEO_PRESETS = {
  ultra: {
    bitrate: 2000,
    resolution: '1920:1080',
    framerate: 30,
    suffix: '_1080p'
  },
  high: {
    bitrate: 1200,
    resolution: '1280:720',
    framerate: 30,
    suffix: '_720p'
  },
  medium: {
    bitrate: 800,
    resolution: '854:480',
    framerate: 30,
    suffix: '_480p'
  },
  low: {
    bitrate: 400,
    resolution: '640:360',
    framerate: 24,
    suffix: '_360p'
  }
};

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
const MIN_FILE_SIZE = 1024 * 1024; // 1MB - only compress files larger than 1MB
const SKIP_COMPRESSED = true; // Skip already compressed files

async function checkFFmpeg() {
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

async function findVideos(directory) {
  try {
    const files = await fs.readdir(directory, { withFileTypes: true });
    let videoFiles = [];

    for (const file of files) {
      const fullPath = path.join(directory, file.name);
      
      if (file.isDirectory()) {
        // Skip compressed directories to avoid infinite recursion
        if (file.name === 'compressed') continue;
        
        // Recursively search subdirectories
        const subVideos = await findVideos(fullPath);
        videoFiles.push(...subVideos);
      } else if (file.isFile()) {
        const ext = path.extname(file.name).toLowerCase();
        if (VIDEO_EXTENSIONS.includes(ext)) {
          // Skip already compressed files
          if (SKIP_COMPRESSED && isCompressedFile(file.name)) {
            continue;
          }
          
          // Check file size
          const stats = await fs.stat(fullPath);
          if (stats.size >= MIN_FILE_SIZE) {
            videoFiles.push({
              path: fullPath,
              name: file.name,
              size: stats.size,
              directory: directory,
            });
          }
        }
      }
    }

    return videoFiles;
  } catch (error) {
    console.warn(`Could not read directory ${directory}:`, error.message);
    return [];
  }
}

function isCompressedFile(filename) {
  const compressedSuffixes = ['_360p', '_480p', '_720p', '_1080p'];
  return compressedSuffixes.some(suffix => filename.includes(suffix));
}

async function compressVideo(inputPath, outputPath, preset, format = 'mp4') {
  return new Promise((resolve, reject) => {
    console.log(`🎬 Compressing ${path.basename(inputPath)} to ${preset.resolution} (${preset.bitrate}k bitrate)`);
    
    const args = [
      '-i', inputPath,
      '-c:v', format === 'webm' ? 'libvpx-vp9' : 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-maxrate', `${preset.bitrate}k`,
      '-bufsize', `${preset.bitrate * 2}k`,
      '-vf', `scale=${preset.resolution}`,
      '-r', preset.framerate.toString(),
      '-c:a', format === 'webm' ? 'libopus' : 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      outputPath
    ];

    // Add WebM specific args
    if (format === 'webm') {
      args.splice(-2, 0, '-deadline', 'good', '-cpu-used', '2');
    }

    const ffmpeg = spawn('ffmpeg', args);
    let duration = 0;
    let currentTime = 0;

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      
      // Parse duration
      const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (durationMatch) {
        const [, hours, minutes, seconds] = durationMatch;
        duration = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
      }
      
      // Parse current time for progress
      const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (timeMatch && duration > 0) {
        const [, hours, minutes, seconds] = timeMatch;
        currentTime = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
        const progress = Math.min((currentTime / duration) * 100, 100);
        
        process.stdout.write(`\r⏳ Progress: ${progress.toFixed(1)}%`);
      }
    });

    ffmpeg.on('close', (code) => {
      process.stdout.write('\n');
      
      if (code === 0) {
        console.log(`✅ Completed: ${path.basename(outputPath)}`);
        resolve();
      } else {
        reject(new Error(`FFmpeg failed with code ${code}`));
      }
    });

    ffmpeg.on('error', reject);
  });
}

async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function compressAllVideos(videos, options = {}) {
  const {
    qualities = ['low', 'medium', 'high'],
    formats = ['mp4'], // webm disabled by default due to issues
    outputDir = null,
  } = options;

  let totalOriginalSize = 0;
  let totalCompressedSize = 0;
  let totalVariants = 0;
  const results = [];

  console.log(`\n🚀 Starting compression of ${videos.length} videos...`);
  console.log(`📋 Qualities: ${qualities.join(', ')}`);
  console.log(`📋 Formats: ${formats.join(', ')}\n`);

  for (const video of videos) {
    console.log(`\n📁 Processing: ${video.name} (${formatBytes(video.size)})`);
    
    // Create output directory
    const videoOutputDir = outputDir || path.join(video.directory, 'compressed');
    await fs.mkdir(videoOutputDir, { recursive: true });

    const baseName = path.parse(video.name).name;
    const videoResults = {
      original: video,
      variants: [],
      totalSaved: 0,
      compressionRatio: 0,
    };

    totalOriginalSize += video.size;

    // Compress each quality and format combination
    for (const quality of qualities) {
      const preset = VIDEO_PRESETS[quality];
      
      for (const format of formats) {
        const outputFileName = `${baseName}${preset.suffix}.${format}`;
        const outputPath = path.join(videoOutputDir, outputFileName);
        
        try {
          await compressVideo(video.path, outputPath, preset, format);
          
          const compressedSize = await getFileSize(outputPath);
          const savedSpace = video.size - compressedSize;
          
          totalCompressedSize += compressedSize;
          totalVariants++;
          
          const variant = {
            quality,
            format,
            path: outputPath,
            size: compressedSize,
            savedSpace,
            compressionRatio: compressedSize > 0 ? (video.size / compressedSize) : 0,
          };
          
          videoResults.variants.push(variant);
          videoResults.totalSaved += savedSpace;
          
          console.log(`   💾 ${quality} ${format}: ${formatBytes(compressedSize)} (saved ${formatBytes(savedSpace)})`);
          
        } catch (error) {
          console.error(`❌ Failed to compress ${quality} ${format}:`, error.message);
        }
      }
    }

    videoResults.compressionRatio = videoResults.totalSaved / video.size;
    results.push(videoResults);
    
    console.log(`   📊 Total saved: ${formatBytes(videoResults.totalSaved)} (${(videoResults.compressionRatio * 100).toFixed(1)}%)`);
  }

  // Final summary
  console.log('\n📊 Compression Summary');
  console.log('=====================');
  console.log(`✅ Videos processed: ${videos.length}`);
  console.log(`✅ Variants created: ${totalVariants}`);
  console.log(`💾 Original total size: ${formatBytes(totalOriginalSize)}`);
  console.log(`💾 Compressed total size: ${formatBytes(totalCompressedSize)}`);
  console.log(`🗜️  Total space saved: ${formatBytes(totalOriginalSize - totalCompressedSize)}`);
  
  if (totalOriginalSize > 0) {
    const overallCompression = ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100;
    console.log(`📉 Overall compression: ${overallCompression.toFixed(1)}%`);
  }

  return results;
}

async function main() {
  console.log('🎥 Batch Video Compression Tool');
  console.log('===============================');

  // Check if FFmpeg is available
  const ffmpegAvailable = await checkFFmpeg();
  if (!ffmpegAvailable) {
    console.error('❌ FFmpeg not found. Please install FFmpeg first.');
    console.error('   macOS: brew install ffmpeg');
    console.error('   Ubuntu: sudo apt install ffmpeg');
    console.error('   Windows: Download from https://ffmpeg.org/download.html');
    process.exit(1);
  }

  // Default directories to search
  const searchDirectories = [
    'public/uploads',
    'assets/videos',
    'static/videos',
  ];

  // Find additional directories from command line args
  const additionalDirs = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
  searchDirectories.push(...additionalDirs);

  // Parse options
  const isProduction = process.env.NODE_ENV === 'production';
  const forceCompress = process.argv.includes('--force');
  const qualities = isProduction ? ['low', 'medium', 'high'] : ['medium'];
  const formats = ['mp4']; // WebM disabled due to compression issues

  console.log(`🔍 Searching for videos in: ${searchDirectories.join(', ')}`);
  console.log(`⚙️  Environment: ${isProduction ? 'production' : 'development'}`);
  console.log(`⚙️  Qualities: ${qualities.join(', ')}`);

  // Find all videos
  let allVideos = [];
  for (const dir of searchDirectories) {
    const dirPath = path.resolve(dir);
    
    try {
      await fs.access(dirPath);
      const videos = await findVideos(dirPath);
      allVideos.push(...videos);
      console.log(`📁 Found ${videos.length} videos in ${dir}`);
    } catch (error) {
      console.log(`📁 Directory ${dir} not found, skipping...`);
    }
  }

  if (allVideos.length === 0) {
    console.log('📭 No videos found to compress.');
    return;
  }

  console.log(`\n📋 Total videos found: ${allVideos.length}`);

  // Remove duplicates
  const uniqueVideos = allVideos.filter((video, index, self) => 
    index === self.findIndex(v => v.path === video.path)
  );

  if (uniqueVideos.length !== allVideos.length) {
    console.log(`📝 Removed ${allVideos.length - uniqueVideos.length} duplicate entries`);
  }

  // Filter out videos that are already compressed (unless forced)
  let videosToCompress = uniqueVideos;
  if (!forceCompress) {
    videosToCompress = uniqueVideos.filter(video => {
      const compressedDir = path.join(video.directory, 'compressed');
      const baseName = path.parse(video.name).name;
      
      // Check if any compressed version exists
      const hasCompressed = qualities.some(quality => {
        const preset = VIDEO_PRESETS[quality];
        const compressedFile = path.join(compressedDir, `${baseName}${preset.suffix}.mp4`);
        try {
          require('fs').accessSync(compressedFile);
          return true;
        } catch {
          return false;
        }
      });
      
      return !hasCompressed;
    });

    if (videosToCompress.length !== uniqueVideos.length) {
      console.log(`⏭️  Skipping ${uniqueVideos.length - videosToCompress.length} already compressed videos`);
      console.log(`💡 Use --force flag to recompress all videos`);
    }
  }

  if (videosToCompress.length === 0) {
    console.log('✅ All videos are already compressed.');
    return;
  }

  // Start compression
  const results = await compressAllVideos(videosToCompress, {
    qualities,
    formats,
  });

  // Generate compression report
  const reportData = {
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development',
    summary: {
      videosProcessed: videosToCompress.length,
      variantsCreated: results.reduce((sum, r) => sum + r.variants.length, 0),
      totalOriginalSize: results.reduce((sum, r) => sum + r.original.size, 0),
      totalCompressedSize: results.reduce((sum, r) => sum + r.variants.reduce((s, v) => s + v.size, 0), 0),
    },
    results,
  };

  // Save compression report
  const reportPath = path.join(process.cwd(), 'compression-report.json');
  await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📊 Compression report saved: ${reportPath}`);

  console.log('\n🎉 Video compression completed successfully!');
}

// Handle command line usage
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { compressAllVideos, findVideos };