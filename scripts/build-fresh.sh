#!/bin/bash

echo "🚀 FRESH BUILD SCRIPT - Bypassing all caches"
echo "=================================="

# Exit on any error
set -e

# Clean everything first
echo "🧹 Step 1: Removing all possible cache locations..."
rm -rf .next .next-* next-build-* /tmp/.next* 2>/dev/null || true
rm -rf /opt/render/project/.next* 2>/dev/null || true
rm -rf /opt/render/.next* 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Use a completely fresh build directory with timestamp
BUILD_ID=$(date +%s)
BUILD_DIR=".next-fresh-${BUILD_ID}"

echo "📦 Step 2: Building to fresh directory: ${BUILD_DIR}"
export NEXT_BUILD_DIR="${BUILD_DIR}"

# Build Next.js with custom output directory
npx next build --experimental-build-mode=compile

# If build succeeded, replace the old .next with the new one
if [ -d "${BUILD_DIR}" ]; then
    echo "✅ Step 3: Build successful, replacing .next directory..."
    rm -rf .next 2>/dev/null || true
    mv "${BUILD_DIR}" .next
    echo "✨ Fresh build complete!"
else
    echo "❌ Build failed or directory not created"
    exit 1
fi

echo "📊 Final check - .next directory contents:"
ls -la .next/ | head -20