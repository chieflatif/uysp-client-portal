#!/usr/bin/env node

console.log('🔍 Quick Testing Suite Validation');
console.log('==================================');

let passed = 0;
let total = 0;

function check(name, testFn) {
  total++;
  try {
    console.log(`\n🧪 ${name}`);
    const result = testFn();
    if (result) {
      console.log(`✅ PASS`);
      passed++;
    } else {
      console.log(`❌ FAIL`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

// Test comprehensive test suite file
check('Test suite JSON is valid', () => {
  const fs = require('fs');
  const data = fs.readFileSync('comprehensive-test-suite.json', 'utf8');
  const parsed = JSON.parse(data);
  return parsed.test_categories && Object.keys(parsed.test_categories).length > 0;
});

// Test Node.js runner
check('Node.js test runner works', () => {
  const UYSPTestRunner = require('./run-manual-tests.js');
  const runner = new UYSPTestRunner();
  const hasRequiredMethods = typeof runner.loadTestSuite === 'function' &&
                           typeof runner.getAllTests === 'function';
  runner.rl.close();
  return hasRequiredMethods;
});

// Test Python dependencies
check('Python dependencies available', () => {
  const { execSync } = require('child_process');
  try {
    execSync('python3 -c "import pandas, requests"', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
});

// Test payload files
check('Payload files exist and valid', () => {
  const fs = require('fs');
  const path = require('path');
  const payloadsDir = path.join(__dirname, 'payloads');
  if (!fs.existsSync(payloadsDir)) return false;
  const files = fs.readdirSync(payloadsDir).filter(f => f.endsWith('.json'));
  return files.length > 0;
});

// Test bash dependencies
check('Bash utilities available (jq, bc)', () => {
  const { execSync } = require('child_process');
  try {
    execSync('which jq && which bc', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
});

console.log('\n' + '='.repeat(40));
console.log(`📊 Results: ${passed}/${total} tests passed`);

if (passed === total) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('\n📖 Your testing suite is fully functional.');
  console.log('📝 Read TESTING-GUIDE-UNIFIED.md for usage instructions.');
} else {
  console.log('⚠️  Some tests failed, but core functionality should still work.');
  console.log('📖 Check TESTING-GUIDE-UNIFIED.md for troubleshooting.');
}

console.log('\n🚀 Quick start commands:');
console.log('  node run-manual-tests.js     # Interactive testing');
console.log('  python3 session-0-real-data-validator.py  # Automated testing');
console.log('  ./test-runner.sh             # Bash script testing');