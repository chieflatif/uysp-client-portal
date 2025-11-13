const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// Get the latest git commit hash
const commitHash = execSync('git rev-parse HEAD').toString().trim();

// Force cache clearing on Render
if (process.env.RENDER) {
  console.log('🚨 RENDER DETECTED - FORCING CACHE CLEAR');
  const clearPaths = [
    '.next',
    '/opt/render/project/.next',
    '/opt/render/.next',
    '/tmp/.next'
  ];
  clearPaths.forEach(p => {
    try {
      if (fs.existsSync(p)) {
        console.log(`Removing ${p}...`);
        execSync(`rm -rf "${p}"`, { stdio: 'inherit' });
      }
    } catch (e) {
      console.log(`Could not remove ${p}:`, e.message);
    }
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set the workspace root to avoid confusion with parent package.json
  outputFileTracingRoot: path.join(__dirname),

  // Force fresh builds
  generateBuildId: async () => {
    return `build-${Date.now()}-${commitHash.slice(0, 7)}`;
  },

  // Disable build caching
  experimental: {
    disableOptimizedLoading: true,
    isrMemoryCacheSize: 0,
  },

  env: {
    NEXT_PUBLIC_GIT_COMMIT_SHA: commitHash,
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
    FORCE_REBUILD: 'true',
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
