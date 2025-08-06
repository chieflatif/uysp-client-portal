#!/usr/bin/env node

/**
 * UYSP Framework Project Validation System
 * Validates project configuration and framework adaptation completeness
 * 
 * Usage: node project-validation-system.js --config project-config.json --project-dir ./new-project
 */

const fs = require('fs');
const path = require('path');

class ProjectValidator {
  constructor(configPath, projectDir) {
    this.config = this.loadConfig(configPath);
    this.projectDir = projectDir;
    this.validationResults = {
      passed: [],
      failed: [],
      warnings: []
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

  // Core Framework Structure Validation
  validateFrameworkStructure() {
    console.log('📁 Validating Framework Structure...');
    
    const requiredDirs = [
      'scripts', 'patterns', 'tests', 'docs', 'config',
      'memory_bank', 'workflows', 'data/schemas', 'templates'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(this.projectDir, dir);
      if (fs.existsSync(dirPath)) {
        this.validationResults.passed.push(`Directory exists: ${dir}`);
      } else {
        this.validationResults.failed.push(`Missing required directory: ${dir}`);
      }
    }
  }

  // Essential Files Validation
  validateEssentialFiles() {
    console.log('📄 Validating Essential Files...');
    
    const requiredFiles = [
      'package.json',
      'README.md',
      '.gitignore',
      'scripts/work-start.sh',
      'scripts/git-workflow.sh',
      'scripts/real-n8n-export.sh',
      'patterns/00-field-normalization-mandatory.txt',
      'config/project-config.json'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectDir, file);
      if (fs.existsSync(filePath)) {
        this.validationResults.passed.push(`File exists: ${file}`);
        
        // Validate file content
        this.validateFileContent(file, filePath);
      } else {
        this.validationResults.failed.push(`Missing required file: ${file}`);
      }
    }
  }

  validateFileContent(file, filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      switch (file) {
        case 'package.json':
          this.validatePackageJson(content);
          break;
        case 'README.md':
          this.validateReadme(content);
          break;
        case 'config/project-config.json':
          this.validateProjectConfig(content);
          break;
        case 'patterns/00-field-normalization-mandatory.txt':
          this.validateFieldNormalization(content);
          break;
      }
    } catch (error) {
      this.validationResults.failed.push(`Error reading ${file}: ${error.message}`);
    }
  }

  validatePackageJson(content) {
    try {
      const pkg = JSON.parse(content);
      
      const requiredScripts = ['start-work', 'branch', 'real-backup'];
      for (const script of requiredScripts) {
        if (pkg.scripts && pkg.scripts[script]) {
          this.validationResults.passed.push(`npm script configured: ${script}`);
        } else {
          this.validationResults.failed.push(`Missing npm script: ${script}`);
        }
      }
    } catch (error) {
      this.validationResults.failed.push(`Invalid package.json: ${error.message}`);
    }
  }

  validateReadme(content) {
    const requiredSections = [
      this.config.projectName,
      'Quick Start',
      'Service Configuration',
      'Development Patterns'
    ];

    for (const section of requiredSections) {
      if (content.includes(section)) {
        this.validationResults.passed.push(`README includes: ${section}`);
      } else {
        this.validationResults.failed.push(`README missing section: ${section}`);
      }
    }

    // Check for UYSP references that should be replaced
    if (content.includes('UYSP Lead Qualification V1') && 
        !content.includes('Based on UYSP')) {
      this.validationResults.warnings.push('README may have unreplaced UYSP references');
    }
  }

  validateProjectConfig(content) {
    try {
      const config = JSON.parse(content);
      
      if (config.projectName === this.config.projectName) {
        this.validationResults.passed.push('Project config has correct name');
      } else {
        this.validationResults.failed.push('Project config name mismatch');
      }

      // Validate service configuration
      if (config.services?.airtable?.baseId !== 'NEW_AIRTABLE_BASE_ID') {
        this.validationResults.passed.push('Airtable Base ID customized');
      } else {
        this.validationResults.warnings.push('Airtable Base ID needs configuration');
      }

      if (config.services?.n8n?.workflowId !== 'NEW_WORKFLOW_ID_HERE') {
        this.validationResults.passed.push('n8n Workflow ID customized');
      } else {
        this.validationResults.warnings.push('n8n Workflow ID needs configuration');
      }

    } catch (error) {
      this.validationResults.failed.push(`Invalid project config: ${error.message}`);
    }
  }

  validateFieldNormalization(content) {
    if (content.includes(this.config.projectSlug) || 
        content.includes(this.config.projectName)) {
      this.validationResults.passed.push('Field normalization pattern customized');
    } else {
      this.validationResults.warnings.push('Field normalization may need project-specific updates');
    }
  }

  // Service Configuration Validation
  validateServiceConfiguration() {
    console.log('⚙️  Validating Service Configuration...');
    
    const services = this.config.services;
    
    // n8n validation
    if (services.n8n) {
      if (services.n8n.workflowId && services.n8n.workflowId !== 'NEW_WORKFLOW_ID_HERE') {
        this.validationResults.passed.push('n8n workflow ID configured');
      } else {
        this.validationResults.warnings.push('n8n workflow ID needs configuration');
      }

      if (services.n8n.webhookPath) {
        this.validationResults.passed.push('n8n webhook path configured');
      } else {
        this.validationResults.failed.push('n8n webhook path missing');
      }
    } else {
      this.validationResults.failed.push('n8n service configuration missing');
    }

    // Airtable validation
    if (services.airtable) {
      if (services.airtable.baseId && services.airtable.baseId !== 'NEW_AIRTABLE_BASE_ID') {
        this.validationResults.passed.push('Airtable base ID configured');
      } else {
        this.validationResults.warnings.push('Airtable base ID needs configuration');
      }

      if (services.airtable.keyTables && services.airtable.keyTables.length > 0) {
        this.validationResults.passed.push(`Airtable tables configured: ${services.airtable.keyTables.length}`);
      } else {
        this.validationResults.warnings.push('Airtable key tables not specified');
      }
    } else {
      this.validationResults.failed.push('Airtable service configuration missing');
    }
  }

  // Pattern Adaptation Validation
  validatePatternAdaptation() {
    console.log('🎯 Validating Pattern Adaptation...');
    
    if (this.config.customization?.patterns) {
      this.validationResults.passed.push(`Custom patterns defined: ${this.config.customization.patterns.length}`);
      
      // Check if patterns are project-specific
      const genericPatterns = ['core-patterns', 'compliance-patterns'];
      const hasCustomPatterns = this.config.customization.patterns.some(
        pattern => !genericPatterns.includes(pattern)
      );
      
      if (hasCustomPatterns) {
        this.validationResults.passed.push('Patterns appear to be project-specific');
      } else {
        this.validationResults.warnings.push('Patterns may be too generic for project');
      }
    } else {
      this.validationResults.warnings.push('No custom patterns defined');
    }

    if (this.config.customization?.testingFocus) {
      this.validationResults.passed.push(`Testing focus areas defined: ${this.config.customization.testingFocus.length}`);
    } else {
      this.validationResults.warnings.push('Testing focus areas not defined');
    }
  }

  // Framework Integration Validation
  validateFrameworkIntegration() {
    console.log('🔧 Validating Framework Integration...');
    
    // Check MCP tools configuration
    const mcpToolsFile = path.join(this.projectDir, 'docs/MCP-TOOL-SPECIFICATIONS-COMPLETE.md');
    if (fs.existsSync(mcpToolsFile)) {
      this.validationResults.passed.push('MCP tools documentation exists');
      
      const content = fs.readFileSync(mcpToolsFile, 'utf8');
      if (content.includes(this.config.services.airtable.baseId)) {
        this.validationResults.passed.push('MCP tools configured for project');
      } else {
        this.validationResults.warnings.push('MCP tools may need project-specific configuration');
      }
    } else {
      this.validationResults.failed.push('MCP tools documentation missing');
    }

    // Check testing framework
    const testingDir = path.join(this.projectDir, 'tests');
    if (fs.existsSync(testingDir)) {
      const testFiles = fs.readdirSync(testingDir).filter(f => f.endsWith('.js') || f.endsWith('.json'));
      if (testFiles.length > 0) {
        this.validationResults.passed.push(`Testing framework exists: ${testFiles.length} test files`);
      } else {
        this.validationResults.warnings.push('Testing framework directory empty');
      }
    }
  }

  // Generate validation report
  generateReport() {
    console.log('\n📊 VALIDATION REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const totalChecks = this.validationResults.passed.length + 
                       this.validationResults.failed.length + 
                       this.validationResults.warnings.length;

    console.log(`📋 Project: ${this.config.projectName}`);
    console.log(`📁 Directory: ${this.projectDir}`);
    console.log(`🔍 Total Checks: ${totalChecks}`);
    console.log('');

    // Passed validations
    if (this.validationResults.passed.length > 0) {
      console.log(`✅ PASSED (${this.validationResults.passed.length}):`);
      this.validationResults.passed.forEach(item => console.log(`   ✅ ${item}`));
      console.log('');
    }

    // Warnings
    if (this.validationResults.warnings.length > 0) {
      console.log(`⚠️  WARNINGS (${this.validationResults.warnings.length}):`);
      this.validationResults.warnings.forEach(item => console.log(`   ⚠️  ${item}`));
      console.log('');
    }

    // Failed validations
    if (this.validationResults.failed.length > 0) {
      console.log(`❌ FAILED (${this.validationResults.failed.length}):`);
      this.validationResults.failed.forEach(item => console.log(`   ❌ ${item}`));
      console.log('');
    }

    // Overall assessment
    const failureRate = this.validationResults.failed.length / totalChecks;
    const warningRate = this.validationResults.warnings.length / totalChecks;
    
    let status, confidence;
    if (failureRate === 0 && warningRate === 0) {
      status = '🟢 EXCELLENT';
      confidence = '95-100%';
    } else if (failureRate === 0 && warningRate < 0.2) {
      status = '🟡 GOOD';
      confidence = '85-94%';
    } else if (failureRate < 0.1) {
      status = '🟠 NEEDS ATTENTION';
      confidence = '75-84%';
    } else {
      status = '🔴 REQUIRES FIXES';
      confidence = '<75%';
    }

    console.log('📈 OVERALL ASSESSMENT:');
    console.log(`   Status: ${status}`);
    console.log(`   Confidence: ${confidence}`);
    console.log(`   Ready for Development: ${failureRate === 0 ? 'YES' : 'NO'}`);
    
    return {
      status,
      confidence,
      readyForDevelopment: failureRate === 0,
      summary: {
        passed: this.validationResults.passed.length,
        warnings: this.validationResults.warnings.length,
        failed: this.validationResults.failed.length,
        total: totalChecks
      }
    };
  }

  async execute() {
    console.log('🔍 UYSP Framework Project Validation System');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Project: ${this.config.projectName}`);
    console.log(`📁 Directory: ${this.projectDir}`);
    console.log('');

    // Run all validations
    this.validateFrameworkStructure();
    this.validateEssentialFiles();
    this.validateServiceConfiguration();
    this.validatePatternAdaptation();
    this.validateFrameworkIntegration();

    // Generate and return report
    return this.generateReport();
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const configIndex = args.indexOf('--config');
  const projectIndex = args.indexOf('--project-dir');

  if (configIndex === -1 || projectIndex === -1) {
    console.error('Usage: node project-validation-system.js --config project-config.json --project-dir ./new-project');
    process.exit(1);
  }

  const configPath = args[configIndex + 1];
  const projectDir = args[projectIndex + 1];

  const validator = new ProjectValidator(configPath, projectDir);
  validator.execute().then(report => {
    process.exit(report.readyForDevelopment ? 0 : 1);
  }).catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = ProjectValidator;