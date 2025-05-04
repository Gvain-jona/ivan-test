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
    // Add better error handling for images
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Add a fallback image for when images fail to load
    unoptimized: process.env.NODE_ENV === 'development',
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

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "gavinjona",
    project: "javascript-nextjs",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    // tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
