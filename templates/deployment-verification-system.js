#!/usr/bin/env node

/**
 * UYSP Framework Deployment Verification System
 * End-to-end verification for production-ready deployment validation
 * 
 * Usage: node deployment-verification-system.js --config project-config.json [OPTIONS]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

class DeploymentVerificationSystem {
  constructor(configPath, options = {}) {
    this.config = this.loadConfig(configPath);
    this.options = {
      verbose: options.verbose || false,
      skipConnectivity: options.skipConnectivity || false,
      skipWebhooks: options.skipWebhooks || false,
      timeout: options.timeout || 30000,
      ...options
    };
    
    this.results = {
      connectivity: { passed: 0, failed: 0, tests: [] },
      webhooks: { passed: 0, failed: 0, tests: [] },
      database: { passed: 0, failed: 0, tests: [] },
      workflows: { passed: 0, failed: 0, tests: [] },
      security: { passed: 0, failed: 0, tests: [] },
      performance: { passed: 0, failed: 0, tests: [] },
      overall: { status: 'unknown', confidence: 0, deploymentReady: false }
    };
  }

  loadConfig(configPath) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error(`❌ Error loading config: ${error.message}`);
      process.exit(1);
    }
  }

  log(level, message) {
    const colors = {
      info: '\x1b[34m',    // Blue
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      success: '\x1b[32m', // Green
      reset: '\x1b[0m'     // Reset
    };
    
    const prefix = {
      info: 'ℹ️ ',
      warn: '⚠️ ',
      error: '❌',
      success: '✅'
    };
    
    console.log(`${colors[level]}${prefix[level]} ${message}${colors.reset}`);
  }

  verbose(message) {
    if (this.options.verbose) {
      this.log('info', message);
    }
  }

  async makeHttpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const req = https.request(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: this.options.timeout,
        ...options
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data,
            responseTime
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${this.options.timeout}ms`));
      });

      req.on('error', reject);

      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  async verifyConnectivity() {
    if (this.options.skipConnectivity) {
      this.log('info', 'Skipping Connectivity Tests (--skip-connectivity)');
      return;
    }

    this.log('info', 'Verifying Service Connectivity...');
    
    const tests = [
      {
        name: 'n8n Instance Reachability',
        url: `https://${this.config.services.n8n.domain || 'your-n8n-instance.com'}`,
        expectedStatus: [200, 401, 403], // Auth required is OK
        critical: true
      },
      {
        name: 'Airtable API Accessibility',
        url: 'https://api.airtable.com/v0/meta/bases',
        expectedStatus: [401, 403], // Auth required
        critical: true
      }
    ];

    for (const test of tests) {
      try {
        this.verbose(`Testing: ${test.name}`);
        const response = await this.makeHttpRequest(test.url);
        
        const testResult = {
          name: test.name,
          passed: test.expectedStatus.includes(response.statusCode),
          responseTime: response.responseTime,
          statusCode: response.statusCode,
          critical: test.critical
        };

        if (testResult.passed) {
          this.results.connectivity.passed++;
          this.verbose(`✅ ${test.name}: ${response.statusCode} (${response.responseTime}ms)`);
        } else {
          this.results.connectivity.failed++;
          this.verbose(`❌ ${test.name}: Unexpected status ${response.statusCode}`);
        }

        this.results.connectivity.tests.push(testResult);
        
      } catch (error) {
        this.results.connectivity.failed++;
        this.results.connectivity.tests.push({
          name: test.name,
          passed: false,
          error: error.message,
          critical: test.critical
        });
        this.verbose(`❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async verifyWebhooks() {
    if (this.options.skipWebhooks) {
      this.log('info', 'Skipping Webhook Tests (--skip-webhooks)');
      return;
    }

    this.log('info', 'Verifying Webhook Endpoints...');
    
    const webhookUrl = `https://${this.config.services.n8n.domain || 'your-n8n-instance.com'}/webhook/${this.config.services.n8n.webhookPath || 'main-webhook'}`;
    
    const webhookTests = [
      {
        name: 'Webhook Endpoint Accessibility',
        method: 'POST',
        body: JSON.stringify({ test: 'connectivity' }),
        headers: { 'Content-Type': 'application/json' },
        expectedStatus: [200, 400, 500], // Various OK responses
        critical: true
      },
      {
        name: 'Webhook Response Time',
        method: 'POST',
        body: JSON.stringify({ 
          email: 'test@deployment-verification.com',
          name: 'Deployment Test',
          timestamp: new Date().toISOString()
        }),
        headers: { 'Content-Type': 'application/json' },
        expectedResponseTime: 10000, // 10 seconds max
        critical: false
      }
    ];

    for (const test of webhookTests) {
      try {
        this.verbose(`Testing: ${test.name}`);
        const response = await this.makeHttpRequest(webhookUrl, {
          method: test.method,
          body: test.body,
          headers: test.headers
        });
        
        let passed = true;
        let issues = [];

        // Check status code
        if (test.expectedStatus && !test.expectedStatus.includes(response.statusCode)) {
          passed = false;
          issues.push(`Unexpected status: ${response.statusCode}`);
        }

        // Check response time
        if (test.expectedResponseTime && response.responseTime > test.expectedResponseTime) {
          passed = false;
          issues.push(`Slow response: ${response.responseTime}ms > ${test.expectedResponseTime}ms`);
        }

        const testResult = {
          name: test.name,
          passed,
          responseTime: response.responseTime,
          statusCode: response.statusCode,
          issues,
          critical: test.critical
        };

        if (passed) {
          this.results.webhooks.passed++;
          this.verbose(`✅ ${test.name}: ${response.statusCode} (${response.responseTime}ms)`);
        } else {
          this.results.webhooks.failed++;
          this.verbose(`❌ ${test.name}: ${issues.join(', ')}`);
        }

        this.results.webhooks.tests.push(testResult);
        
      } catch (error) {
        this.results.webhooks.failed++;
        this.results.webhooks.tests.push({
          name: test.name,
          passed: false,
          error: error.message,
          critical: test.critical
        });
        this.verbose(`❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async verifyDatabase() {
    this.log('info', 'Verifying Database Configuration...');
    
    const tests = [
      {
        name: 'Airtable Base ID Format Validation',
        test: () => {
          const baseId = this.config.services.airtable.baseId;
          return baseId && baseId.startsWith('app') && baseId.length === 17;
        },
        critical: true
      },
      {
        name: 'Required Tables Configuration',
        test: () => {
          const tables = this.config.services.airtable.keyTables;
          return tables && Array.isArray(tables) && tables.length > 0;
        },
        critical: true
      },
      {
        name: 'Table Naming Convention',
        test: () => {
          const tables = this.config.services.airtable.keyTables || [];
          return tables.every(table => 
            typeof table === 'string' && 
            table.length > 0 && 
            /^[A-Za-z][A-Za-z0-9_]*$/.test(table)
          );
        },
        critical: false
      }
    ];

    for (const test of tests) {
      try {
        const passed = test.test();
        
        const testResult = {
          name: test.name,
          passed,
          critical: test.critical
        };

        if (passed) {
          this.results.database.passed++;
          this.verbose(`✅ ${test.name}`);
        } else {
          this.results.database.failed++;
          this.verbose(`❌ ${test.name}`);
        }

        this.results.database.tests.push(testResult);
        
      } catch (error) {
        this.results.database.failed++;
        this.results.database.tests.push({
          name: test.name,
          passed: false,
          error: error.message,
          critical: test.critical
        });
        this.verbose(`❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async verifyWorkflows() {
    this.log('info', 'Verifying Workflow Configuration...');
    
    const tests = [
      {
        name: 'n8n Workflow ID Format Validation',
        test: () => {
          const workflowId = this.config.services.n8n.workflowId;
          return workflowId && 
                 workflowId !== 'NEW_WORKFLOW_ID_HERE' &&
                 typeof workflowId === 'string' &&
                 workflowId.length > 10;
        },
        critical: true
      },
      {
        name: 'Webhook Path Configuration',
        test: () => {
          const webhookPath = this.config.services.n8n.webhookPath;
          return webhookPath && 
                 typeof webhookPath === 'string' &&
                 webhookPath.length > 0 &&
                 !/\s/.test(webhookPath); // No spaces
        },
        critical: true
      },
      {
        name: 'Domain Configuration',
        test: () => {
          const domain = this.config.services.n8n.domain;
          return domain && 
                 domain !== 'your-n8n-instance.com' &&
                 /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain);
        },
        critical: true
      },
      {
        name: 'Integration Services Configuration',
        test: () => {
          const integrations = this.config.services.integrations;
          return integrations && 
                 Array.isArray(integrations) && 
                 integrations.length > 0;
        },
        critical: false
      }
    ];

    for (const test of tests) {
      try {
        const passed = test.test();
        
        const testResult = {
          name: test.name,
          passed,
          critical: test.critical
        };

        if (passed) {
          this.results.workflows.passed++;
          this.verbose(`✅ ${test.name}`);
        } else {
          this.results.workflows.failed++;
          this.verbose(`❌ ${test.name}`);
        }

        this.results.workflows.tests.push(testResult);
        
      } catch (error) {
        this.results.workflows.failed++;
        this.results.workflows.tests.push({
          name: test.name,
          passed: false,
          error: error.message,
          critical: test.critical
        });
        this.verbose(`❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async verifySecurity() {
    this.log('info', 'Verifying Security Configuration...');
    
    const tests = [
      {
        name: 'No Default/Placeholder Credentials',
        test: () => {
          const config = JSON.stringify(this.config);
          const placeholders = [
            'YOUR_API_KEY', 'REPLACE_WITH', 'NEW_WORKFLOW_ID_HERE',
            'NEW_AIRTABLE_BASE_ID', 'your-n8n-instance.com'
          ];
          return !placeholders.some(placeholder => config.includes(placeholder));
        },
        critical: true
      },
      {
        name: 'Webhook Path Security',
        test: () => {
          const webhookPath = this.config.services.n8n.webhookPath;
          // Should not be too obvious/guessable
          const obviousPaths = ['webhook', 'api', 'test', 'data', 'leads'];
          return webhookPath && !obviousPaths.includes(webhookPath.toLowerCase());
        },
        critical: false
      },
      {
        name: 'HTTPS Configuration',
        test: () => {
          const domain = this.config.services.n8n.domain;
          // Ensure no HTTP in domain configuration
          return domain && !domain.includes('http://');
        },
        critical: true
      },
      {
        name: 'Compliance Configuration',
        test: () => {
          return this.config.compliance || 
                 (this.config.customization && 
                  this.config.customization.patterns && 
                  this.config.customization.patterns.some(p => p.includes('compliance')));
        },
        critical: false
      }
    ];

    for (const test of tests) {
      try {
        const passed = test.test();
        
        const testResult = {
          name: test.name,
          passed,
          critical: test.critical
        };

        if (passed) {
          this.results.security.passed++;
          this.verbose(`✅ ${test.name}`);
        } else {
          this.results.security.failed++;
          this.verbose(`❌ ${test.name}`);
        }

        this.results.security.tests.push(testResult);
        
      } catch (error) {
        this.results.security.failed++;
        this.results.security.tests.push({
          name: test.name,
          passed: false,
          error: error.message,
          critical: test.critical
        });
        this.verbose(`❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async verifyPerformance() {
    this.log('info', 'Verifying Performance Configuration...');
    
    const tests = [
      {
        name: 'Testing Framework Efficiency',
        test: () => {
          const testingFocus = this.config.customization?.testingFocus || [];
          // Should have focused testing areas, not trying to test everything
          return testingFocus.length > 0 && testingFocus.length <= 10;
        },
        critical: false
      },
      {
        name: 'Pattern Configuration Efficiency',
        test: () => {
          const patterns = this.config.customization?.patterns || [];
          // Should have specific patterns, not generic ones
          return patterns.length > 0 && 
                 patterns.some(p => !['core-patterns', 'basic-patterns'].includes(p));
        },
        critical: false
      },
      {
        name: 'Integration Scope Optimization',
        test: () => {
          const integrations = this.config.services.integrations || [];
          // Should not have too many integrations for performance
          return integrations.length <= 15;
        },
        critical: false
      },
      {
        name: 'Data Processing Configuration',
        test: () => {
          // Check for batch processing, caching, or similar optimizations
          const config = JSON.stringify(this.config).toLowerCase();
          const optimizations = ['batch', 'cache', 'queue', 'async', 'parallel'];
          return optimizations.some(opt => config.includes(opt));
        },
        critical: false
      }
    ];

    for (const test of tests) {
      try {
        const passed = test.test();
        
        const testResult = {
          name: test.name,
          passed,
          critical: test.critical
        };

        if (passed) {
          this.results.performance.passed++;
          this.verbose(`✅ ${test.name}`);
        } else {
          this.results.performance.failed++;
          this.verbose(`❌ ${test.name}`);
        }

        this.results.performance.tests.push(testResult);
        
      } catch (error) {
        this.results.performance.failed++;
        this.results.performance.tests.push({
          name: test.name,
          passed: false,
          error: error.message,
          critical: test.critical
        });
        this.verbose(`❌ ${test.name}: ${error.message}`);
      }
    }
  }

  calculateOverallStatus() {
    const categories = ['connectivity', 'webhooks', 'database', 'workflows', 'security', 'performance'];
    let totalPassed = 0;
    let totalTests = 0;
    let criticalFailures = 0;

    for (const category of categories) {
      const result = this.results[category];
      totalPassed += result.passed;
      totalTests += result.passed + result.failed;
      
      // Count critical failures
      result.tests.forEach(test => {
        if (test.critical && !test.passed) {
          criticalFailures++;
        }
      });
    }

    const overallScore = totalTests > 0 ? totalPassed / totalTests : 0;
    
    if (criticalFailures > 0) {
      this.results.overall.status = 'CRITICAL_FAILURES';
      this.results.overall.confidence = Math.min(overallScore * 100, 50);
      this.results.overall.deploymentReady = false;
    } else if (overallScore >= 0.95) {
      this.results.overall.status = 'PRODUCTION_READY';
      this.results.overall.confidence = Math.round(overallScore * 100);
      this.results.overall.deploymentReady = true;
    } else if (overallScore >= 0.85) {
      this.results.overall.status = 'DEPLOYMENT_READY';
      this.results.overall.confidence = Math.round(overallScore * 100);
      this.results.overall.deploymentReady = true;
    } else if (overallScore >= 0.7) {
      this.results.overall.status = 'NEEDS_FIXES';
      this.results.overall.confidence = Math.round(overallScore * 100);
      this.results.overall.deploymentReady = false;
    } else {
      this.results.overall.status = 'NOT_READY';
      this.results.overall.confidence = Math.round(overallScore * 100);
      this.results.overall.deploymentReady = false;
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 DEPLOYMENT VERIFICATION REPORT');
    console.log('='.repeat(80));
    
    const statusEmoji = {
      'PRODUCTION_READY': '🟢',
      'DEPLOYMENT_READY': '🟡',
      'NEEDS_FIXES': '🟠',
      'NOT_READY': '🔴',
      'CRITICAL_FAILURES': '💥'
    };

    console.log(`\n📋 Project: ${this.config.projectName}`);
    console.log(`⏰ Verification Time: ${new Date().toISOString()}`);
    console.log(`📊 Overall Status: ${statusEmoji[this.results.overall.status]} ${this.results.overall.status}`);
    console.log(`🎯 Confidence Score: ${this.results.overall.confidence}%`);
    console.log(`🚀 Deployment Ready: ${this.results.overall.deploymentReady ? 'YES' : 'NO'}`);

    // Category breakdown
    console.log('\n📋 VERIFICATION BREAKDOWN:');
    const categories = ['connectivity', 'webhooks', 'database', 'workflows', 'security', 'performance'];
    
    for (const category of categories) {
      const result = this.results[category];
      const total = result.passed + result.failed;
      
      if (total === 0) {
        console.log(`   ⏭️  ${category.toUpperCase()}: SKIPPED`);
        continue;
      }
      
      const percentage = Math.round((result.passed / total) * 100);
      const status = percentage >= 90 ? '✅' : percentage >= 70 ? '⚠️ ' : '❌';
      
      console.log(`   ${status} ${category.toUpperCase()}: ${result.passed}/${total} (${percentage}%)`);
      
      if (this.options.verbose) {
        result.tests.forEach(test => {
          const testStatus = test.passed ? '✅' : (test.critical ? '💥' : '⚠️ ');
          const timing = test.responseTime ? ` (${test.responseTime}ms)` : '';
          console.log(`      ${testStatus} ${test.name}${timing}`);
        });
      }
    }

    // Critical issues
    const criticalIssues = [];
    categories.forEach(cat => {
      this.results[cat].tests.forEach(test => {
        if (test.critical && !test.passed) {
          criticalIssues.push(`${cat}: ${test.name}`);
        }
      });
    });

    if (criticalIssues.length > 0) {
      console.log('\n💥 CRITICAL ISSUES:');
      criticalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    // Deployment readiness
    console.log('\n🎯 DEPLOYMENT READINESS:');
    if (this.results.overall.deploymentReady) {
      console.log('   ✅ System verified and ready for production deployment');
      console.log('   🚀 Next steps:');
      console.log('     1. Run final integration tests');
      console.log('     2. Deploy to production environment');
      console.log('     3. Monitor initial traffic and performance');
    } else {
      console.log('   ❌ System not ready for deployment');
      console.log('   🔧 Required actions:');
      if (criticalIssues.length > 0) {
        console.log('     1. Fix all critical issues listed above');
      }
      console.log('     2. Complete configuration (service IDs, credentials)');
      console.log('     3. Re-run verification after fixes');
      console.log('     4. Consider staging environment testing');
    }

    console.log('\n' + '='.repeat(80));
    return this.results.overall;
  }

  async execute() {
    console.log('🚀 UYSP Framework Deployment Verification System');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Project: ${this.config.projectName}`);
    console.log(`🔧 Timeout: ${this.options.timeout}ms`);
    console.log('');
    
    await this.verifyConnectivity();
    await this.verifyWebhooks();
    await this.verifyDatabase();
    await this.verifyWorkflows();
    await this.verifySecurity();
    await this.verifyPerformance();
    
    this.calculateOverallStatus();
    const result = this.generateReport();
    
    return result;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const configIndex = args.indexOf('--config');

  if (configIndex === -1) {
    console.error('Usage: node deployment-verification-system.js --config project-config.json [OPTIONS]');
    console.error('');
    console.error('Options:');
    console.error('  --verbose            Show detailed test output');
    console.error('  --skip-connectivity  Skip connectivity tests');
    console.error('  --skip-webhooks      Skip webhook tests');
    console.error('  --timeout MILLISECONDS  Request timeout (default: 30000)');
    process.exit(1);
  }

  const configPath = args[configIndex + 1];
  const timeoutIndex = args.indexOf('--timeout');
  const timeout = timeoutIndex !== -1 ? parseInt(args[timeoutIndex + 1]) : 30000;
  
  const options = {
    verbose: args.includes('--verbose'),
    skipConnectivity: args.includes('--skip-connectivity'),
    skipWebhooks: args.includes('--skip-webhooks'),
    timeout
  };

  const verifier = new DeploymentVerificationSystem(configPath, options);
  verifier.execute().then(result => {
    process.exit(result.deploymentReady ? 0 : 1);
  }).catch(error => {
    console.error('❌ Deployment verification failed:', error.message);
    process.exit(1);
  });
}

module.exports = DeploymentVerificationSystem;