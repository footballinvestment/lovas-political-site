#!/usr/bin/env node

// scripts/check-and-compress-videos.js
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

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

async function findUncompressedVideos(directory) {
  const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const COMPRESSED_SUFFIXES = ['_360p', '_480p', '_720p', '_1080p'];
  
  try {
    const files = await fs.readdir(directory, { withFileTypes: true });
    let uncompressedVideos = [];

    for (const file of files) {
      const fullPath = path.join(directory, file.name);
      
      if (file.isDirectory()) {
        // Skip compressed directories
        if (file.name === 'compressed') continue;
        
        // Recursively search subdirectories
        const subVideos = await findUncompressedVideos(fullPath);
        uncompressedVideos.push(...subVideos);
      } else if (file.isFile()) {
        const ext = path.extname(file.name).toLowerCase();
        if (VIDEO_EXTENSIONS.includes(ext)) {
          // Skip already compressed files
          const isCompressed = COMPRESSED_SUFFIXES.some(suffix => file.name.includes(suffix));
          if (isCompressed) continue;
          
          // Check if compressed versions exist
          const baseName = path.parse(file.name).name;
          const compressedDir = path.join(directory, 'compressed');
          
          let hasCompressedVersions = false;
          try {
            await fs.access(compressedDir);
            
            // Check for at least one compressed version
            const compressedFiles = await fs.readdir(compressedDir);
            hasCompressedVersions = compressedFiles.some(compressedFile => 
              compressedFile.startsWith(baseName) && 
              COMPRESSED_SUFFIXES.some(suffix => compressedFile.includes(suffix))
            );
          } catch (error) {
            // Compressed directory doesn't exist
            hasCompressedVersions = false;
          }
          
          if (!hasCompressedVersions) {
            // Check file size (only compress files larger than 1MB)
            const stats = await fs.stat(fullPath);
            if (stats.size >= 1024 * 1024) {
              uncompressedVideos.push({
                path: fullPath,
                name: file.name,
                size: stats.size,
                directory: directory,
              });
            }
          }
        }
      }
    }

    return uncompressedVideos;
  } catch (error) {
    console.warn(`Could not read directory ${directory}:`, error.message);
    return [];
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
  console.log('🔍 Checking for uncompressed videos...');

  // Check if this is a production build
  const isProduction = process.env.NODE_ENV === 'production';
  const isBuildProcess = process.env.npm_lifecycle_event === 'build';
  
  // Skip compression in development builds unless explicitly requested
  if (!isProduction && !process.argv.includes('--force')) {
    console.log('⏭️  Skipping video compression in development mode');
    console.log('💡 Use "npm run compress-videos" to compress manually');
    console.log('💡 Use --force flag to compress in development');
    return;
  }

  // Check if FFmpeg is available
  const ffmpegAvailable = await checkFFmpeg();
  if (!ffmpegAvailable) {
    if (isProduction) {
      console.error('❌ FFmpeg not found. Video compression is required for production builds.');
      console.error('   Please install FFmpeg and try again.');
      process.exit(1);
    } else {
      console.warn('⚠️  FFmpeg not found. Skipping video compression.');
      console.warn('   Install FFmpeg to enable video compression.');
      return;
    }
  }

  // Search directories
  const searchDirectories = [
    'public/uploads',
    'assets/videos',
    'static/videos',
  ];

  console.log(`🔍 Searching for uncompressed videos in: ${searchDirectories.join(', ')}`);

  // Find all uncompressed videos
  let uncompressedVideos = [];
  for (const dir of searchDirectories) {
    const dirPath = path.resolve(dir);
    
    try {
      await fs.access(dirPath);
      const videos = await findUncompressedVideos(dirPath);
      uncompressedVideos.push(...videos);
      
      if (videos.length > 0) {
        console.log(`📁 Found ${videos.length} uncompressed videos in ${dir}`);
        videos.forEach(video => {
          console.log(`   📹 ${video.name} (${formatBytes(video.size)})`);
        });
      }
    } catch (error) {
      // Directory doesn't exist, which is fine
    }
  }

  if (uncompressedVideos.length === 0) {
    console.log('✅ All videos are already compressed or no videos found.');
    return;
  }

  console.log(`\n📋 Found ${uncompressedVideos.length} uncompressed video(s)`);

  // Ask for confirmation in interactive mode
  if (process.stdin.isTTY && !process.argv.includes('--yes')) {
    const totalSize = uncompressedVideos.reduce((sum, video) => sum + video.size, 0);
    console.log(`📊 Total size to compress: ${formatBytes(totalSize)}`);
    console.log('\n🤔 Do you want to compress these videos now?');
    console.log('   This may take several minutes depending on file sizes.');
    console.log('   Press Ctrl+C to cancel, or wait 10 seconds to auto-proceed...');
    
    // Auto-proceed after 10 seconds
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('\n⏩ Auto-proceeding with compression...');
        resolve();
      }, 10000);
      
      process.stdin.once('data', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  // Run compression
  console.log('\n🚀 Starting video compression...');
  
  try {
    const compressScript = path.join(__dirname, 'compress-all-videos.js');
    const child = spawn('node', [compressScript, '--force'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: isProduction ? 'production' : 'development' }
    });

    const exitCode = await new Promise((resolve) => {
      child.on('close', resolve);
    });

    if (exitCode === 0) {
      console.log('\n✅ Video compression completed successfully!');
    } else {
      console.error('\n❌ Video compression failed with exit code:', exitCode);
      if (isProduction) {
        process.exit(exitCode);
      }
    }
  } catch (error) {
    console.error('\n❌ Failed to run video compression:', error.message);
    if (isProduction) {
      process.exit(1);
    }
  }
}

// Handle command line usage
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { findUncompressedVideos };