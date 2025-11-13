const path = require('path');
const { execSync } = require('child_process');

// Get the latest git commit hash
const commitHash = execSync('git rev-parse HEAD').toString().trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set the workspace root to avoid confusion with parent package.json
  outputFileTracingRoot: path.join(__dirname),
  env: {
    NEXT_PUBLIC_GIT_COMMIT_SHA: commitHash,
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Standard Next.js configuration
  // Enable response compression
  compress: true,
  // Add security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig;
