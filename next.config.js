/** @type {import('next').NextConfig} */

// Conditionally load bundle analyzer only if available
let withBundleAnalyzer = (config) => config
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  })
} catch (error) {
  // Bundle analyzer not available, skip it
}

const baseExperimental = {
  serverActions: {
    bodySizeLimit: '10mb', // Increased from default 1MB to 10MB
  },
  typedRoutes: true,
  // Note: PPR requires Next.js canary. Uncomment when upgrading:
  // ppr: 'incremental',
}

const nextConfig = {
  // Increase body size limit for Server Actions (for image uploads)
  experimental: baseExperimental,

  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    resolveAlias: {
      'react': 'react',
      'react-dom': 'react-dom',
    },
  },

  serverExternalPackages: [
    '@supabase/ssr',
    '@supabase/supabase-js',
    '@prisma/instrumentation',
    '@opentelemetry/instrumentation',
  ],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 3600, // Cache for 1 hour
    formats: ['image/webp', 'image/avif'], // Modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: false,
  },
  // Disable source maps in development to reduce memory usage and compilation time
  productionBrowserSourceMaps: false,

  // Performance optimizations
  compiler: {
    // Remove console logs in production for better performance
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Vercel-specific configuration
  trailingSlash: false,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

// Increase event emitter max listeners to prevent warnings
if (typeof process !== 'undefined') {
  process.setMaxListeners(20)
}

module.exports = withBundleAnalyzer(nextConfig)
