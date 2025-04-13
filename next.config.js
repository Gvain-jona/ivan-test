/** @type {import('next').NextConfig} */

// Load environment variables
require('dotenv').config();

// Log environment variables for debugging
console.log('Environment Variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const nextConfig = {
  // Disable strict mode for now to help with debugging
  reactStrictMode: false,
  poweredByHeader: false,
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [],
  },
  // Remove redirects and rewrites to avoid conflict with middleware
  // Ensure trailing slashes are handled consistently
  trailingSlash: false,

  // Add debug logging for page rendering
  logging: {
    level: 'verbose',
    fetches: {
      fullUrl: true
    }
  },
  // Add logging for debugging build and routing
  onDemandEntries: {
    // Keep pages in memory for longer during development
    maxInactiveAge: 60 * 60 * 1000,
    // Number of pages to keep in memory
    pagesBufferLength: 5,
  },
  // Temporarily disable experimental features to fix module resolution issues
  // experimental: {
  //   turbo: {
  //     devOverlay: true
  //   }
  // },
  webpack: (config, { isServer }) => {
    // Add UTF-8 encoding configuration
    config.module.rules.push({
      test: /\.(tsx|ts|js|jsx)$/,
      use: [
        {
          loader: 'string-replace-loader',
          options: {
            search: /[\uD800-\uDFFF]/g,
            replace: '',
            flags: 'g'
          }
        }
      ]
    });
    return config;
  }
};

// Log config for debugging
console.log('Next.js Config:', JSON.stringify(nextConfig, null, 2));

module.exports = nextConfig;