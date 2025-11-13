#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 FORCE CLEAR CACHE SCRIPT STARTING...');
console.log('Current directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV);

// List of all possible cache locations on Render
const cacheLocations = [
  '.next',
  '../.next',
  '../../.next',
  '/opt/render/project/.next',
  '/opt/render/.next',
  '/tmp/.next',
  'node_modules/.cache',
  '../node_modules/.cache',
  '/opt/render/project/node_modules/.cache',
  '/opt/render/project/src/.next',
];

// Function to safely remove a directory
function safeRemove(dir) {
  const fullPath = path.resolve(dir);
  try {
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ Found and removing: ${fullPath}`);
      execSync(`rm -rf "${fullPath}"`, { stdio: 'inherit' });
    } else {
      console.log(`  ⏭️  Not found: ${fullPath}`);
    }
  } catch (error) {
    console.log(`  ⚠️  Could not remove ${fullPath}: ${error.message}`);
  }
}

console.log('\n📂 Checking for cache directories...');
cacheLocations.forEach(safeRemove);

// Also search for any chunks directories
console.log('\n🔍 Searching for chunk directories...');
try {
  const findCommand = `find /opt/render -name 'chunks' -type d 2>/dev/null || true`;
  const chunks = execSync(findCommand, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);

  if (chunks.length > 0) {
    console.log(`Found ${chunks.length} chunk directories:`);
    chunks.forEach(chunkDir => {
      console.log(`  Removing: ${chunkDir}`);
      try {
        execSync(`rm -rf "${chunkDir}"`, { stdio: 'inherit' });
      } catch (e) {
        console.log(`  Could not remove: ${e.message}`);
      }
    });
  } else {
    console.log('No chunk directories found.');
  }
} catch (error) {
  console.log('Could not search for chunks:', error.message);
}

// Clear Node.js module cache
console.log('\n🗑️  Clearing Node.js module cache...');
Object.keys(require.cache).forEach((key) => {
  delete require.cache[key];
});

console.log('\n✨ Cache clearing complete!');
console.log('Free space:', execSync('df -h / | tail -1', { encoding: 'utf-8' }).trim());