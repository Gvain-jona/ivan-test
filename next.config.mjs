/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Add support for Web Workers
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: { loader: 'worker-loader' },
    });

    return config;
  },

  // Handle development-only routes
  async rewrites() {
    // In production, redirect development-only routes to 404
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/api/enable-public-access',
          destination: '/api/not-found',
        },
        {
          source: '/api/init-admin',
          destination: '/api/not-found',
        },
        {
          source: '/api/init-db',
          destination: '/api/not-found',
        },
        {
          source: '/api/seed',
          destination: '/api/not-found',
        },
        {
          source: '/api/test-db',
          destination: '/api/not-found',
        },
        {
          source: '/api/test-profiles',
          destination: '/api/not-found',
        },
        {
          source: '/api/test-supabase',
          destination: '/api/not-found',
        },
      ];
    }

    // In development, use the actual routes
    return [];
  },
};

export default nextConfig;
