/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization configuration
  images: {
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],
    
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Image sizes for different use cases
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Default quality is now handled automatically by Next.js 14
    
    // Legacy domains config (use remotePatterns instead)
    // domains: [],
    
    // Remote patterns for external images (Next.js 14)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
    ],
    
    // Disable static imports to force optimization
    disableStaticImages: false,
    
    // Enable experimental features
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Performance optimizations
  experimental: {
    // Enable CSS optimization
    optimizeCss: true,
    
    // Enable webpack build worker (Next.js 14 compatible)
    webpackBuildWorker: true,
    
    // Enable memory usage optimizations
    memoryBasedWorkersCount: true,
    
    // Enable modern bundling optimizations
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Compression and bundling
  compress: true,
  
  // Enable runtime checks in development
  reactStrictMode: true,
  
  // Webpack configuration for bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      // Enable tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };

      // Optimize bundle splitting
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Vendor chunk for third-party libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Common chunk for shared code
          common: {
            minChunks: 2,
            chunks: 'all',
            name: 'common',
            priority: 5,
          },
          // Styles chunk
          styles: {
            name: 'styles',
            test: /\.(css|scss|sass)$/,
            chunks: 'all',
            enforce: true,
            priority: 20,
          },
        },
      };
    }

    // Bundle analyzer in development
    if (dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 3001,
          openAnalyzer: false,
        })
      );
    }

    return config;
  },

  // Headers for performance and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Cache static assets aggressively
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          // API responses shouldn't be cached
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          // Cache optimized images for a long time
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for SEO and performance
  async redirects() {
    return [
      // Add common redirects here
    ];
  },

  // Rewrites for cleaner URLs
  async rewrites() {
    return [
      // Add URL rewrites here if needed
    ];
  },

  // Environment variables
  env: {
    NEXT_TELEMETRY_DISABLED: '1', // Disable Next.js telemetry for performance
  },

  // Output configuration (Next.js 14)
  output: 'standalone', // For Docker deployments
  
  // ESLint configuration
  eslint: {
    // Disable ESLint during builds for faster compilation
    ignoreDuringBuilds: false,
  },
  
  // TypeScript configuration
  typescript: {
    // Type checking during builds
    ignoreBuildErrors: false,
  },
  
  // Enable trailing slash for consistency
  trailingSlash: false,
  
  // Power optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  
  // Generate build ID for cache busting
  generateBuildId: async () => {
    return process.env.BUILD_ID || `build-${Date.now()}`;
  },
  
  // Next.js 14 specific optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
