const path = require('path');
const { execSync } = require('child_process');

// Get the latest git commit hash
const commitHash = execSync('git rev-parse HEAD').toString().trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_GIT_COMMIT_SHA: commitHash,
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable all caching to force fresh builds on Render
  generateBuildId: async () => {
    // Generate unique build ID based on timestamp to prevent cache reuse
    return `build-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  },
  // Change output directory to bypass cached artifacts
  distDir: process.env.RENDER ? '.next-render' : '.next',
  // Disable build output caching
  experimental: {
    isrMemoryCacheSize: 0,
  },
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
