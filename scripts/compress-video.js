#!/usr/bin/env node

// scripts/compress-video.js
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

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

async function getVideoInfo(inputPath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      inputPath
    ]);
    
    let output = '';
    
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ffprobe.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(output);
          resolve(info);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`FFprobe failed with code ${code}`));
      }
    });
    
    ffprobe.on('error', reject);
  });
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

async function main() {
  console.log('🎥 Video Compression Tool');
  console.log('========================');

  // Check if FFmpeg is available
  const ffmpegAvailable = await checkFFmpeg();
  if (!ffmpegAvailable) {
    console.error('❌ FFmpeg not found. Please install FFmpeg first.');
    console.error('   macOS: brew install ffmpeg');
    console.error('   Ubuntu: sudo apt install ffmpeg');
    console.error('   Windows: Download from https://ffmpeg.org/download.html');
    process.exit(1);
  }

  const inputFile = process.argv[2] || 'public/uploads/escobarhun_cut.mp4';
  const inputPath = path.resolve(inputFile);

  // Check if input file exists
  try {
    await fs.access(inputPath);
  } catch (error) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  // Get original file info
  console.log(`📁 Input: ${inputPath}`);
  
  const originalSize = await getFileSize(inputPath);
  console.log(`📏 Original size: ${formatBytes(originalSize)}`);

  try {
    const videoInfo = await getVideoInfo(inputPath);
    const videoStream = videoInfo.streams.find(s => s.codec_type === 'video');
    
    if (videoStream) {
      console.log(`🎞️  Original resolution: ${videoStream.width}x${videoStream.height}`);
      console.log(`⏱️  Duration: ${parseFloat(videoInfo.format.duration).toFixed(1)}s`);
    }
  } catch (error) {
    console.warn('⚠️  Could not get video info:', error.message);
  }

  // Create output directory
  const outputDir = path.join(path.dirname(inputPath), 'compressed');
  await fs.mkdir(outputDir, { recursive: true });

  const baseName = path.parse(inputPath).name;
  const totalVariants = Object.keys(VIDEO_PRESETS).length * 2; // MP4 + WebM
  let completedVariants = 0;
  let totalSavedSpace = 0;

  console.log(`\n🚀 Starting compression (${totalVariants} variants)...\n`);

  // Compress each quality preset
  for (const [quality, preset] of Object.entries(VIDEO_PRESETS)) {
    // MP4 version
    const mp4Output = path.join(outputDir, `${baseName}${preset.suffix}.mp4`);
    
    try {
      await compressVideo(inputPath, mp4Output, preset, 'mp4');
      const mp4Size = await getFileSize(mp4Output);
      const savedSpace = originalSize - mp4Size;
      totalSavedSpace += savedSpace;
      
      console.log(`   💾 Size: ${formatBytes(mp4Size)} (saved ${formatBytes(savedSpace)})`);
      completedVariants++;
    } catch (error) {
      console.error(`❌ Failed to create MP4 ${quality}:`, error.message);
    }

    // WebM version
    const webmOutput = path.join(outputDir, `${baseName}${preset.suffix}.webm`);
    
    try {
      await compressVideo(inputPath, webmOutput, preset, 'webm');
      const webmSize = await getFileSize(webmOutput);
      const savedSpace = originalSize - webmSize;
      totalSavedSpace += savedSpace;
      
      console.log(`   💾 Size: ${formatBytes(webmSize)} (saved ${formatBytes(savedSpace)})`);
      completedVariants++;
    } catch (error) {
      console.error(`❌ Failed to create WebM ${quality}:`, error.message);
    }

    console.log('');
  }

  // Summary
  console.log('📊 Compression Summary');
  console.log('=====================');
  console.log(`✅ Completed: ${completedVariants}/${totalVariants} variants`);
  console.log(`💾 Original size: ${formatBytes(originalSize)}`);
  console.log(`🗜️  Total space saved: ${formatBytes(totalSavedSpace)}`);
  console.log(`📉 Average compression: ${((totalSavedSpace / originalSize) * 100 / completedVariants).toFixed(1)}%`);
  console.log(`📂 Output directory: ${outputDir}`);

  // List generated files
  try {
    const files = await fs.readdir(outputDir);
    const videoFiles = files.filter(f => f.endsWith('.mp4') || f.endsWith('.webm'));
    
    console.log('\n📋 Generated files:');
    for (const file of videoFiles) {
      const filePath = path.join(outputDir, file);
      const size = await getFileSize(filePath);
      console.log(`   ${file} (${formatBytes(size)})`);
    }
  } catch (error) {
    console.error('❌ Failed to list output files:', error.message);
  }

  // Check if we achieved the target
  const averageSize = totalSavedSpace > 0 ? 
    (originalSize - (totalSavedSpace / completedVariants)) : originalSize;
  
  const targetSize = 5 * 1024 * 1024; // 5MB
  
  if (averageSize <= targetSize) {
    console.log('\n🎉 SUCCESS: Target file size (<5MB) achieved!');
  } else {
    console.log(`\n⚠️  WARNING: Average file size (${formatBytes(averageSize)}) still exceeds 5MB target`);
    console.log('   Consider using more aggressive compression settings');
  }

  console.log('\n🔄 Next steps:');
  console.log('1. Copy compressed files to public/uploads/compressed/');
  console.log('2. Update your slides data to use the new video sources');
  console.log('3. Test the adaptive video player');
}

// Handle command line usage
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { compressVideo, VIDEO_PRESETS };