#!/usr/bin/env node

/**
 * UYSP Framework Test Suite Adapter
 * Adapts existing test infrastructure for customized framework projects
 * 
 * Usage: node test-suite-adapter.js --config project-config.json --test-dir ./tests
 */

const fs = require('fs');
const path = require('path');

class TestSuiteAdapter {
  constructor(configPath, testDir) {
    this.config = this.loadConfig(configPath);
    this.testDir = testDir;
    this.adaptedTests = [];
    this.sourceTestsDir = path.join(__dirname, '..', 'tests');
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

  async adaptTestSuite() {
    this.log('info', 'Adapting Test Suite for Project...');
    
    // Load source test suite
    const sourceTestSuitePath = path.join(this.sourceTestsDir, 'comprehensive-test-suite.json');
    if (!fs.existsSync(sourceTestSuitePath)) {
      throw new Error('Source test suite not found');
    }

    const sourceTestSuite = JSON.parse(fs.readFileSync(sourceTestSuitePath, 'utf8'));
    
    // Adapt test configuration
    const adaptedTestSuite = {
      project: this.config.projectName,
      description: `Adapted test suite for ${this.config.projectDescription}`,
      version: "1.0-adapted",
      webhook_url: `https://${this.config.services.n8n.domain}/webhook/${this.config.services.n8n.webhookPath}`,
      airtable_base: this.config.services.airtable.baseId,
      test_categories: this.adaptTestCategories(sourceTestSuite.test_categories),
      tests: this.adaptTests(sourceTestSuite.tests)
    };

    // Write adapted test suite
    const outputPath = path.join(this.testDir, 'comprehensive-test-suite.json');
    fs.writeFileSync(outputPath, JSON.stringify(adaptedTestSuite, null, 2));
    
    this.log('success', `Adapted test suite written to: ${outputPath}`);
    return adaptedTestSuite;
  }

  adaptTestCategories(sourceCategories) {
    const adaptedCategories = {};
    
    // Map UYSP categories to project-specific categories
    const categoryMapping = this.createCategoryMapping();
    
    for (const [categoryId, category] of Object.entries(sourceCategories)) {
      if (categoryMapping[categoryId]) {
        adaptedCategories[categoryId] = {
          ...category,
          name: categoryMapping[categoryId].name || category.name,
          description: categoryMapping[categoryId].description || category.description,
          focus: categoryMapping[categoryId].focus || category.focus
        };
      } else {
        // Keep original category if no mapping specified
        adaptedCategories[categoryId] = category;
      }
    }
    
    return adaptedCategories;
  }

  createCategoryMapping() {
    const projectType = this.inferProjectType();
    
    const mappings = {
      'crm': {
        'FV': {
          name: 'CRM Field Variations',
          description: 'Tests CRM-specific field mapping and normalization',
          focus: 'contact_data_mapping'
        },
        'BC': {
          name: 'CRM Boolean Conversions', 
          description: 'Tests CRM boolean field handling (active/inactive, opted_in/opted_out)',
          focus: 'crm_boolean_fields'
        },
        'EC': {
          name: 'CRM Integration Edge Cases',
          description: 'Tests CRM-specific edge cases and error handling',
          focus: 'crm_data_quality'
        }
      },
      'ecommerce': {
        'FV': {
          name: 'Order Field Variations',
          description: 'Tests e-commerce order field mapping and normalization',
          focus: 'order_data_mapping'
        },
        'BC': {
          name: 'Order Status Conversions',
          description: 'Tests order status and payment boolean handling',
          focus: 'order_status_fields'
        },
        'EC': {
          name: 'E-commerce Edge Cases', 
          description: 'Tests payment failures, inventory issues, and data validation',
          focus: 'ecommerce_error_handling'
        }
      },
      'pipeline': {
        'FV': {
          name: 'Data Pipeline Field Variations',
          description: 'Tests multi-source data field mapping and normalization',
          focus: 'pipeline_data_mapping'
        },
        'BC': {
          name: 'Data Quality Conversions',
          description: 'Tests data quality boolean flags and validation markers',
          focus: 'data_quality_fields'
        },
        'EC': {
          name: 'Pipeline Processing Edge Cases',
          description: 'Tests pipeline failures, data corruption, and recovery scenarios',
          focus: 'pipeline_error_handling'
        }
      },
      'notification': {
        'FV': {
          name: 'Notification Field Variations',
          description: 'Tests notification data field mapping and channel routing',
          focus: 'notification_data_mapping'
        },
        'BC': {
          name: 'Channel Preference Conversions',
          description: 'Tests notification preference boolean handling',
          focus: 'notification_preference_fields'
        },
        'EC': {
          name: 'Notification Delivery Edge Cases',
          description: 'Tests delivery failures, opt-outs, and retry scenarios',
          focus: 'notification_error_handling'
        }
      }
    };

    return mappings[projectType] || {};
  }

  inferProjectType() {
    const slug = this.config.projectSlug.toLowerCase();
    const description = this.config.projectDescription.toLowerCase();
    const integrations = (this.config.services.integrations || []).join(' ').toLowerCase();
    
    if (slug.includes('crm') || description.includes('crm') || integrations.includes('salesforce') || integrations.includes('hubspot')) {
      return 'crm';
    }
    
    if (slug.includes('ecommerce') || slug.includes('shop') || description.includes('order') || integrations.includes('shopify')) {
      return 'ecommerce';
    }
    
    if (slug.includes('pipeline') || slug.includes('data') || description.includes('etl') || description.includes('pipeline')) {
      return 'pipeline';
    }
    
    if (slug.includes('notification') || description.includes('notification') || integrations.includes('twilio') || integrations.includes('sendgrid')) {
      return 'notification';
    }
    
    return 'generic';
  }

  adaptTests(sourceTests) {
    const adaptedTests = [];
    
    for (const test of sourceTests) {
      const adaptedTest = {
        ...test,
        payload: this.adaptTestPayload(test.payload, test.category),
        expected: this.adaptTestExpectations(test.expected, test.category),
        verification: this.adaptTestVerification(test.verification, test.category)
      };
      
      adaptedTests.push(adaptedTest);
      this.adaptedTests.push({
        original: test.id,
        adapted: adaptedTest.id,
        category: test.category
      });
    }
    
    return adaptedTests;
  }

  adaptTestPayload(payload, category) {
    const projectType = this.inferProjectType();
    const fieldMappings = this.config.customization?.fieldMappings;
    
    if (!fieldMappings) {
      return payload; // No field mapping specified, use as-is
    }

    const adaptedPayload = { ...payload };
    
    // Adapt core fields based on project configuration
    if (fieldMappings.keyFields) {
      // Map project-specific key fields
      fieldMappings.keyFields.forEach((field, index) => {
        if (payload.email && field.includes('email')) {
          adaptedPayload[field] = payload.email;
        }
        if (payload.name && field.includes('name')) {
          adaptedPayload[field] = payload.name;
        }
        if (payload.company && field.includes('company')) {
          adaptedPayload[field] = payload.company;
        }
      });
    }
    
    // Add project-specific fields
    switch (projectType) {
      case 'crm':
        adaptedPayload.source_crm = 'test_system';
        adaptedPayload.contact_type = 'lead';
        break;
      case 'ecommerce':
        adaptedPayload.order_total = '99.99';
        adaptedPayload.payment_status = 'completed';
        break;
      case 'pipeline':
        adaptedPayload.source_system = 'test_api';
        adaptedPayload.data_quality_score = '0.95';
        break;
      case 'notification':
        adaptedPayload.channel_preference = 'email';
        adaptedPayload.urgency_level = 'normal';
        break;
    }
    
    return adaptedPayload;
  }

  adaptTestExpectations(expected, category) {
    const fieldMappings = this.config.customization?.fieldMappings;
    
    if (!fieldMappings) {
      return expected;
    }

    const adaptedExpected = { ...expected };
    
    // Update expected normalized fields based on project configuration
    if (fieldMappings.keyFields && expected.normalized_fields) {
      adaptedExpected.normalized_fields = [
        ...fieldMappings.keyFields,
        ...(fieldMappings.enrichmentFields || []),
        ...(fieldMappings.metricFields || [])
      ].filter((field, index, arr) => arr.indexOf(field) === index); // Remove duplicates
    }
    
    return adaptedExpected;
  }

  adaptTestVerification(verification, category) {
    const adaptedVerification = { ...verification };
    
    // Update table references
    if (this.config.services.airtable.keyTables) {
      const primaryTable = this.config.services.airtable.keyTables[0];
      if (verification.airtable_table === 'People') {
        adaptedVerification.airtable_table = primaryTable;
      }
    }
    
    return adaptedVerification;
  }

  async adaptTestRunners() {
    this.log('info', 'Adapting Test Runners...');
    
    const runners = [
      'run-manual-tests.js',
      'test-runner.sh'
    ];
    
    for (const runner of runners) {
      const sourcePath = path.join(this.sourceTestsDir, runner);
      const targetPath = path.join(this.testDir, runner);
      
      if (fs.existsSync(sourcePath)) {
        let content = fs.readFileSync(sourcePath, 'utf8');
        
        // Replace UYSP-specific references
        content = content.replace(/UYSP/g, this.config.projectSlug.toUpperCase());
        content = content.replace(/uysp/g, this.config.projectSlug.toLowerCase());
        content = content.replace(/appuBf0fTe8tp8ZaF/g, this.config.services.airtable.baseId);
        content = content.replace(/rebelhq\.app\.n8n\.cloud/g, this.config.services.n8n.domain);
        content = content.replace(/kajabi-leads/g, this.config.services.n8n.webhookPath);
        
        fs.writeFileSync(targetPath, content);
        
        // Make shell scripts executable
        if (runner.endsWith('.sh')) {
          fs.chmodSync(targetPath, '755');
        }
        
        this.log('success', `Adapted test runner: ${runner}`);
      }
    }
  }

  async createTestPayloads(testSuite) {
    this.log('info', 'Creating Test Payload Files...');
    
    const payloadsDir = path.join(this.testDir, 'payloads');
    if (!fs.existsSync(payloadsDir)) {
      fs.mkdirSync(payloadsDir, { recursive: true });
    }
    
    for (const test of testSuite.tests) {
      const payloadPath = path.join(payloadsDir, `${test.id}-${test.name.toLowerCase().replace(/\s+/g, '-')}.json`);
      fs.writeFileSync(payloadPath, JSON.stringify(test.payload, null, 2));
    }
    
    this.log('success', `Created ${testSuite.tests.length} test payload files`);
  }

  async createAdaptedReadme() {
    this.log('info', 'Creating Adapted Test Documentation...');
    
    const readmeContent = `# ${this.config.projectName} - Test Suite

## Adapted from UYSP Framework

**Project**: ${this.config.projectDescription}  
**Test Categories**: ${Object.keys(this.config.customization?.testingFocus || {}).length} focus areas  
**Webhook URL**: https://${this.config.services.n8n.domain}/webhook/${this.config.services.n8n.webhookPath}  
**Database**: ${this.config.services.airtable.baseId}

## Quick Start

\`\`\`bash
# Interactive testing
node run-manual-tests.js

# Automated testing  
./test-runner.sh
\`\`\`

## Test Categories Adapted

${this.generateCategoryDocumentation()}

## Project-Specific Testing Focus

${this.generateTestingFocusDocumentation()}

## Integration Points

${this.generateIntegrationDocumentation()}

---

**Framework Source**: UYSP Lead Qualification V1  
**Adaptation Date**: ${new Date().toISOString().split('T')[0]}  
**Test Framework Version**: 1.0-adapted
`;

    const readmePath = path.join(this.testDir, 'README.md');
    fs.writeFileSync(readmePath, readmeContent);
    
    this.log('success', 'Created adapted test documentation');
  }

  generateCategoryDocumentation() {
    const projectType = this.inferProjectType();
    const categoryMapping = this.createCategoryMapping();
    
    return Object.entries(categoryMapping).map(([categoryId, mapping]) => {
      return `### ${mapping.name}\n- **Focus**: ${mapping.focus}\n- **Description**: ${mapping.description}`;
    }).join('\n\n') || '- Standard field mapping and validation tests\n- Adapted for project requirements';
  }

  generateTestingFocusDocumentation() {
    const testingFocus = this.config.customization?.testingFocus || [];
    
    return testingFocus.map(focus => `- ${focus}`).join('\n') || '- Field mapping validation\n- Integration testing\n- Error handling';
  }

  generateIntegrationDocumentation() {
    const integrations = this.config.services.integrations || [];
    
    return integrations.map(integration => `- ${integration}`).join('\n') || '- Core workflow integration\n- Database connectivity\n- Error handling';
  }

  async execute() {
    console.log('🧪 UYSP Framework Test Suite Adapter');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Project: ${this.config.projectName}`);
    console.log(`📁 Target: ${this.testDir}`);
    console.log('');
    
    // Create test directory if it doesn't exist
    if (!fs.existsSync(this.testDir)) {
      fs.mkdirSync(this.testDir, { recursive: true });
    }

    // Adapt test suite
    const adaptedTestSuite = await this.adaptTestSuite();
    
    // Adapt test runners
    await this.adaptTestRunners();
    
    // Create test payloads
    await this.createTestPayloads(adaptedTestSuite);
    
    // Create documentation
    await this.createAdaptedReadme();
    
    console.log('');
    this.log('success', 'Test Suite Adaptation Complete!');
    console.log(`📊 Adapted ${adaptedTestSuite.tests.length} tests across ${Object.keys(adaptedTestSuite.test_categories).length} categories`);
    console.log('📋 Next steps:');
    console.log('   1. Review adapted test configuration');
    console.log('   2. Update service credentials');
    console.log('   3. Run test validation: node run-manual-tests.js');
    
    return {
      testsAdapted: adaptedTestSuite.tests.length,
      categoriesAdapted: Object.keys(adaptedTestSuite.test_categories).length,
      adaptationMapping: this.adaptedTests
    };
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const configIndex = args.indexOf('--config');
  const testDirIndex = args.indexOf('--test-dir');

  if (configIndex === -1 || testDirIndex === -1) {
    console.error('Usage: node test-suite-adapter.js --config project-config.json --test-dir ./tests');
    process.exit(1);
  }

  const configPath = args[configIndex + 1];
  const testDir = args[testDirIndex + 1];

  const adapter = new TestSuiteAdapter(configPath, testDir);
  adapter.execute().catch(error => {
    console.error('❌ Test suite adaptation failed:', error.message);
    process.exit(1);
  });
}

module.exports = TestSuiteAdapter;