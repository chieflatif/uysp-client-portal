#!/usr/bin/env node

/**
 * UYSP Framework Import Validation System
 * Comprehensive validation for exported/imported framework integrity
 * 
 * Usage: node framework-import-validator.js --project-dir ./imported-project [OPTIONS]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FrameworkImportValidator {
  constructor(projectDir, options = {}) {
    this.projectDir = projectDir;
    this.options = {
      verbose: options.verbose || false,
      skipTests: options.skipTests || false,
      skipIntegration: options.skipIntegration || false,
      ...options
    };
    
    this.results = {
      structure: { passed: 0, failed: 0, issues: [] },
      dependencies: { passed: 0, failed: 0, issues: [] },
      configuration: { passed: 0, failed: 0, issues: [] },
      integration: { passed: 0, failed: 0, issues: [] },
      testing: { passed: 0, failed: 0, issues: [] },
      overall: { status: 'unknown', confidence: 0, ready: false }
    };
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

  async validateFrameworkStructure() {
    this.log('info', 'Validating Framework Structure...');
    
    const requiredStructure = {
      directories: [
        'scripts', 'patterns', 'tests', 'docs', 'config',
        'memory_bank', 'workflows', 'data/schemas', 'templates',
        'context', '.cursorrules'
      ],
      files: [
        'package.json', 'README.md', '.gitignore',
        'scripts/work-start.sh', 'scripts/git-workflow.sh', 'scripts/real-n8n-export.sh',
        'patterns/00-field-normalization-mandatory.txt',
        'config/project-config.json',
        '.cursorrules/00-CRITICAL-ALWAYS.md'
      ],
      optional: [
        'workflows/backups', 'tests/results', 'tests/evidence',
        'docs/agents', 'memory_bank/sessions'
      ]
    };

    // Check required directories
    for (const dir of requiredStructure.directories) {
      const dirPath = path.join(this.projectDir, dir);
      if (fs.existsSync(dirPath)) {
        this.results.structure.passed++;
        this.verbose(`Directory exists: ${dir}`);
      } else {
        this.results.structure.failed++;
        this.results.structure.issues.push(`Missing directory: ${dir}`);
      }
    }

    // Check required files
    for (const file of requiredStructure.files) {
      const filePath = path.join(this.projectDir, file);
      if (fs.existsSync(filePath)) {
        this.results.structure.passed++;
        this.verbose(`File exists: ${file}`);
        
        // Basic content validation
        await this.validateFileContent(file, filePath);
      } else {
        this.results.structure.failed++;
        this.results.structure.issues.push(`Missing file: ${file}`);
      }
    }

    // Check optional components (warnings only)
    for (const optional of requiredStructure.optional) {
      const optionalPath = path.join(this.projectDir, optional);
      if (!fs.existsSync(optionalPath)) {
        this.verbose(`Optional component missing: ${optional}`);
      }
    }

    const structureScore = this.results.structure.passed / 
                          (this.results.structure.passed + this.results.structure.failed);
    
    if (structureScore >= 0.95) {
      this.log('success', `Framework structure: ${Math.round(structureScore * 100)}% complete`);
    } else if (structureScore >= 0.8) {
      this.log('warn', `Framework structure: ${Math.round(structureScore * 100)}% complete (issues detected)`);
    } else {
      this.log('error', `Framework structure: ${Math.round(structureScore * 100)}% complete (critical issues)`);
    }
  }

  async validateFileContent(file, filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      switch (file) {
        case 'package.json':
          await this.validatePackageJson(content);
          break;
        case 'README.md':
          await this.validateReadme(content);
          break;
        case 'config/project-config.json':
          await this.validateProjectConfig(content);
          break;
        case '.cursorrules/00-CRITICAL-ALWAYS.md':
          await this.validateCriticalRules(content);
          break;
        case 'patterns/00-field-normalization-mandatory.txt':
          await this.validateFieldNormalization(content);
          break;
      }
    } catch (error) {
      this.results.structure.issues.push(`Error reading ${file}: ${error.message}`);
    }
  }

  async validatePackageJson(content) {
    try {
      const pkg = JSON.parse(content);
      
      const requiredScripts = ['start-work', 'branch', 'real-backup'];
      let scriptCount = 0;
      
      for (const script of requiredScripts) {
        if (pkg.scripts && pkg.scripts[script]) {
          scriptCount++;
          this.verbose(`npm script configured: ${script}`);
        } else {
          this.results.structure.issues.push(`Missing npm script: ${script}`);
        }
      }
      
      if (scriptCount === requiredScripts.length) {
        this.results.structure.passed++;
      } else {
        this.results.structure.failed++;
      }
    } catch (error) {
      this.results.structure.failed++;
      this.results.structure.issues.push(`Invalid package.json: ${error.message}`);
    }
  }

  async validateReadme(content) {
    const requiredSections = [
      'Quick Start', 'Service Configuration', 'Development Patterns'
    ];
    
    let sectionCount = 0;
    for (const section of requiredSections) {
      if (content.includes(section)) {
        sectionCount++;
        this.verbose(`README includes: ${section}`);
      } else {
        this.results.structure.issues.push(`README missing section: ${section}`);
      }
    }
    
    // Check for proper framework attribution
    if (content.includes('Based on UYSP') || content.includes('UYSP Framework')) {
      sectionCount++;
      this.verbose('README has proper framework attribution');
    } else {
      this.results.structure.issues.push('README missing framework attribution');
    }
    
    if (sectionCount >= requiredSections.length) {
      this.results.structure.passed++;
    } else {
      this.results.structure.failed++;
    }
  }

  async validateProjectConfig(content) {
    try {
      const config = JSON.parse(content);
      
      const requiredFields = ['projectName', 'projectSlug', 'services'];
      let fieldCount = 0;
      
      for (const field of requiredFields) {
        if (config[field]) {
          fieldCount++;
          this.verbose(`Project config has: ${field}`);
        } else {
          this.results.structure.issues.push(`Project config missing: ${field}`);
        }
      }
      
      // Check service configuration
      if (config.services) {
        if (config.services.n8n) {
          this.verbose('n8n service configured');
        } else {
          this.results.structure.issues.push('n8n service configuration missing');
        }
        
        if (config.services.airtable) {
          this.verbose('Airtable service configured');
        } else {
          this.results.structure.issues.push('Airtable service configuration missing');
        }
      }
      
      if (fieldCount === requiredFields.length) {
        this.results.structure.passed++;
      } else {
        this.results.structure.failed++;
      }
    } catch (error) {
      this.results.structure.failed++;
      this.results.structure.issues.push(`Invalid project config: ${error.message}`);
    }
  }

  async validateCriticalRules(content) {
    const requiredPatterns = [
      'ANTI-HALLUCINATION',
      'CONFIDENCE SCORE',
      'MCP VERIFICATION',
      'EVIDENCE-BASED'
    ];
    
    let patternCount = 0;
    for (const pattern of requiredPatterns) {
      if (content.includes(pattern)) {
        patternCount++;
        this.verbose(`Critical rules include: ${pattern}`);
      } else {
        this.results.structure.issues.push(`Critical rules missing: ${pattern}`);
      }
    }
    
    if (patternCount >= requiredPatterns.length * 0.8) {
      this.results.structure.passed++;
    } else {
      this.results.structure.failed++;
    }
  }

  async validateFieldNormalization(content) {
    if (content.length > 100 && content.includes('field') && content.includes('normalization')) {
      this.results.structure.passed++;
      this.verbose('Field normalization pattern appears valid');
    } else {
      this.results.structure.failed++;
      this.results.structure.issues.push('Field normalization pattern incomplete');
    }
  }

  async validateDependencies() {
    this.log('info', 'Validating Dependencies...');
    
    try {
      const packageJsonPath = path.join(this.projectDir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        this.results.dependencies.failed++;
        this.results.dependencies.issues.push('package.json not found');
        return;
      }

      // Check if node_modules exists or can be installed
      const nodeModulesPath = path.join(this.projectDir, 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        this.verbose('node_modules not found, testing npm install...');
        
        try {
          const originalCwd = process.cwd();
          process.chdir(this.projectDir);
          
          execSync('npm install --silent', { stdio: 'pipe' });
          this.results.dependencies.passed++;
          this.verbose('npm install successful');
          
          process.chdir(originalCwd);
        } catch (error) {
          this.results.dependencies.failed++;
          this.results.dependencies.issues.push(`npm install failed: ${error.message}`);
        }
      } else {
        this.results.dependencies.passed++;
        this.verbose('node_modules exists');
      }

      // Check for script executability
      const scriptsDir = path.join(this.projectDir, 'scripts');
      if (fs.existsSync(scriptsDir)) {
        const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.sh'));
        
        for (const script of scripts) {
          const scriptPath = path.join(scriptsDir, script);
          try {
            fs.accessSync(scriptPath, fs.constants.X_OK);
            this.results.dependencies.passed++;
            this.verbose(`Script executable: ${script}`);
          } catch (error) {
            this.results.dependencies.failed++;
            this.results.dependencies.issues.push(`Script not executable: ${script}`);
          }
        }
      }

    } catch (error) {
      this.results.dependencies.failed++;
      this.results.dependencies.issues.push(`Dependency validation failed: ${error.message}`);
    }
  }

  async validateConfiguration() {
    this.log('info', 'Validating Configuration...');
    
    try {
      const configPath = path.join(this.projectDir, 'config/project-config.json');
      if (!fs.existsSync(configPath)) {
        this.results.configuration.failed++;
        this.results.configuration.issues.push('Project configuration file missing');
        return;
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Validate service configuration readiness
      if (config.services?.airtable?.baseId && 
          config.services.airtable.baseId !== 'NEW_AIRTABLE_BASE_ID') {
        this.results.configuration.passed++;
        this.verbose('Airtable configuration ready');
      } else {
        this.results.configuration.failed++;
        this.results.configuration.issues.push('Airtable base ID needs configuration');
      }

      if (config.services?.n8n?.workflowId && 
          config.services.n8n.workflowId !== 'NEW_WORKFLOW_ID_HERE') {
        this.results.configuration.passed++;
        this.verbose('n8n configuration ready');
      } else {
        this.results.configuration.failed++;
        this.results.configuration.issues.push('n8n workflow ID needs configuration');
      }

      // Check pattern adaptation
      if (config.customization?.patterns && config.customization.patterns.length > 0) {
        this.results.configuration.passed++;
        this.verbose(`${config.customization.patterns.length} custom patterns defined`);
      } else {
        this.results.configuration.failed++;
        this.results.configuration.issues.push('No custom patterns defined');
      }

      // Check testing configuration
      if (config.customization?.testingFocus && config.customization.testingFocus.length > 0) {
        this.results.configuration.passed++;
        this.verbose(`${config.customization.testingFocus.length} testing focus areas defined`);
      } else {
        this.results.configuration.failed++;
        this.results.configuration.issues.push('Testing focus areas not defined');
      }

    } catch (error) {
      this.results.configuration.failed++;
      this.results.configuration.issues.push(`Configuration validation failed: ${error.message}`);
    }
  }

  async validateIntegration() {
    if (this.options.skipIntegration) {
      this.log('info', 'Skipping Integration Validation (--skip-integration)');
      return;
    }

    this.log('info', 'Validating Integration Components...');
    
    try {
      // Check MCP tools documentation
      const mcpDocsPath = path.join(this.projectDir, 'docs/MCP-TOOL-SPECIFICATIONS-COMPLETE.md');
      if (fs.existsSync(mcpDocsPath)) {
        const mcpContent = fs.readFileSync(mcpDocsPath, 'utf8');
        
        // Check for tool specifications
        if (mcpContent.includes('n8n') && mcpContent.includes('airtable')) {
          this.results.integration.passed++;
          this.verbose('MCP tools properly documented');
        } else {
          this.results.integration.failed++;
          this.results.integration.issues.push('MCP tools documentation incomplete');
        }
      } else {
        this.results.integration.failed++;
        this.results.integration.issues.push('MCP tools documentation missing');
      }

      // Check context engineering system
      const contextDirs = ['context/PM', 'context/TESTING', 'context/DEVELOPER'];
      let contextCount = 0;
      
      for (const contextDir of contextDirs) {
        const contextPath = path.join(this.projectDir, contextDir);
        if (fs.existsSync(contextPath)) {
          contextCount++;
          this.verbose(`Context directory exists: ${contextDir}`);
        }
      }
      
      if (contextCount >= 2) {
        this.results.integration.passed++;
        this.verbose('Context engineering system present');
      } else {
        this.results.integration.failed++;
        this.results.integration.issues.push('Context engineering system incomplete');
      }

      // Check backup system integration
      const backupScripts = ['scripts/git-backup.sh', 'scripts/auto-backup.sh'];
      let backupCount = 0;
      
      for (const script of backupScripts) {
        const scriptPath = path.join(this.projectDir, script);
        if (fs.existsSync(scriptPath)) {
          backupCount++;
          this.verbose(`Backup script exists: ${script}`);
        }
      }
      
      if (backupCount >= 1) {
        this.results.integration.passed++;
        this.verbose('Backup system integrated');
      } else {
        this.results.integration.failed++;
        this.results.integration.issues.push('Backup system not integrated');
      }

    } catch (error) {
      this.results.integration.failed++;
      this.results.integration.issues.push(`Integration validation failed: ${error.message}`);
    }
  }

  async validateTestingFramework() {
    if (this.options.skipTests) {
      this.log('info', 'Skipping Testing Validation (--skip-tests)');
      return;
    }

    this.log('info', 'Validating Testing Framework...');
    
    try {
      // Check test suite structure
      const testDir = path.join(this.projectDir, 'tests');
      if (!fs.existsSync(testDir)) {
        this.results.testing.failed++;
        this.results.testing.issues.push('Tests directory missing');
        return;
      }

      // Check for test files
      const testFiles = [
        'tests/README.md',
        'tests/comprehensive-test-suite.json',
        'tests/run-manual-tests.js'
      ];
      
      let testFileCount = 0;
      for (const testFile of testFiles) {
        const testPath = path.join(this.projectDir, testFile);
        if (fs.existsSync(testPath)) {
          testFileCount++;
          this.verbose(`Test file exists: ${testFile}`);
        }
      }
      
      if (testFileCount >= testFiles.length * 0.8) {
        this.results.testing.passed++;
        this.verbose('Test framework structure present');
      } else {
        this.results.testing.failed++;
        this.results.testing.issues.push('Test framework structure incomplete');
      }

      // Check payload files
      const payloadsDir = path.join(this.projectDir, 'tests/payloads');
      if (fs.existsSync(payloadsDir)) {
        const payloads = fs.readdirSync(payloadsDir).filter(f => f.endsWith('.json'));
        if (payloads.length > 0) {
          this.results.testing.passed++;
          this.verbose(`${payloads.length} test payloads found`);
        } else {
          this.results.testing.failed++;
          this.results.testing.issues.push('No test payloads found');
        }
      } else {
        this.results.testing.failed++;
        this.results.testing.issues.push('Test payloads directory missing');
      }

      // Validate test configuration adaptation
      const testSuitePath = path.join(this.projectDir, 'tests/comprehensive-test-suite.json');
      if (fs.existsSync(testSuitePath)) {
        try {
          const testSuite = JSON.parse(fs.readFileSync(testSuitePath, 'utf8'));
          
          if (testSuite.tests && testSuite.tests.length > 0) {
            this.results.testing.passed++;
            this.verbose(`${testSuite.tests.length} tests configured`);
          } else {
            this.results.testing.failed++;
            this.results.testing.issues.push('No tests configured in test suite');
          }
        } catch (error) {
          this.results.testing.failed++;
          this.results.testing.issues.push('Invalid test suite JSON');
        }
      }

    } catch (error) {
      this.results.testing.failed++;
      this.results.testing.issues.push(`Testing validation failed: ${error.message}`);
    }
  }

  calculateOverallStatus() {
    const categories = ['structure', 'dependencies', 'configuration', 'integration', 'testing'];
    let totalPassed = 0;
    let totalTests = 0;
    let criticalFailures = 0;

    for (const category of categories) {
      const result = this.results[category];
      totalPassed += result.passed;
      totalTests += result.passed + result.failed;
      
      // Critical categories (structure, dependencies, configuration)
      if (['structure', 'dependencies', 'configuration'].includes(category) && result.failed > 0) {
        criticalFailures += result.failed;
      }
    }

    const overallScore = totalTests > 0 ? totalPassed / totalTests : 0;
    
    if (criticalFailures > 0) {
      this.results.overall.status = 'CRITICAL_ISSUES';
      this.results.overall.confidence = Math.min(overallScore * 100, 60);
      this.results.overall.ready = false;
    } else if (overallScore >= 0.95) {
      this.results.overall.status = 'EXCELLENT';
      this.results.overall.confidence = Math.round(overallScore * 100);
      this.results.overall.ready = true;
    } else if (overallScore >= 0.85) {
      this.results.overall.status = 'GOOD';
      this.results.overall.confidence = Math.round(overallScore * 100);
      this.results.overall.ready = true;
    } else if (overallScore >= 0.7) {
      this.results.overall.status = 'NEEDS_ATTENTION';
      this.results.overall.confidence = Math.round(overallScore * 100);
      this.results.overall.ready = false;
    } else {
      this.results.overall.status = 'REQUIRES_FIXES';
      this.results.overall.confidence = Math.round(overallScore * 100);
      this.results.overall.ready = false;
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 FRAMEWORK IMPORT VALIDATION REPORT');
    console.log('='.repeat(80));
    
    const statusEmoji = {
      'EXCELLENT': '🟢',
      'GOOD': '🟡',
      'NEEDS_ATTENTION': '🟠',
      'REQUIRES_FIXES': '🔴',
      'CRITICAL_ISSUES': '💥'
    };

    console.log(`\n📁 Project Directory: ${this.projectDir}`);
    console.log(`⏰ Validation Time: ${new Date().toISOString()}`);
    console.log(`📊 Overall Status: ${statusEmoji[this.results.overall.status]} ${this.results.overall.status}`);
    console.log(`🎯 Confidence Score: ${this.results.overall.confidence}%`);
    console.log(`🚀 Ready for Development: ${this.results.overall.ready ? 'YES' : 'NO'}`);

    // Category breakdown
    console.log('\n📋 VALIDATION BREAKDOWN:');
    const categories = ['structure', 'dependencies', 'configuration', 'integration', 'testing'];
    
    for (const category of categories) {
      const result = this.results[category];
      const total = result.passed + result.failed;
      const percentage = total > 0 ? Math.round((result.passed / total) * 100) : 0;
      const status = percentage >= 90 ? '✅' : percentage >= 70 ? '⚠️ ' : '❌';
      
      console.log(`   ${status} ${category.toUpperCase()}: ${result.passed}/${total} (${percentage}%)`);
      
      if (result.issues.length > 0 && this.options.verbose) {
        result.issues.forEach(issue => console.log(`      • ${issue}`));
      }
    }

    // Issues summary
    const allIssues = [];
    categories.forEach(cat => allIssues.push(...this.results[cat].issues));
    
    if (allIssues.length > 0) {
      console.log('\n⚠️  ISSUES DETECTED:');
      allIssues.slice(0, 10).forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      
      if (allIssues.length > 10) {
        console.log(`   ... and ${allIssues.length - 10} more issues`);
        console.log('   (Use --verbose for complete issue list)');
      }
    }

    // Next steps
    console.log('\n🎯 NEXT STEPS:');
    if (this.results.overall.ready) {
      console.log('   ✅ Framework is ready for development');
      console.log('   1. Configure service IDs (n8n workflow, Airtable base)');
      console.log('   2. Run framework tests: cd tests && node run-manual-tests.js');
      console.log('   3. Start development: npm run start-work');
    } else {
      console.log('   🔧 Framework requires fixes before development:');
      if (this.results.structure.failed > 0) {
        console.log('   1. Fix structural issues (missing files/directories)');
      }
      if (this.results.dependencies.failed > 0) {
        console.log('   2. Resolve dependency issues (npm install, script permissions)');
      }
      if (this.results.configuration.failed > 0) {
        console.log('   3. Complete configuration (service IDs, patterns)');
      }
      console.log('   4. Re-run validation after fixes');
    }

    console.log('\n' + '='.repeat(80));
    return this.results.overall;
  }

  async execute() {
    console.log('🔍 UYSP Framework Import Validation System');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📁 Validating: ${this.projectDir}`);
    
    if (!fs.existsSync(this.projectDir)) {
      this.log('error', `Project directory does not exist: ${this.projectDir}`);
      process.exit(1);
    }

    console.log('');
    
    await this.validateFrameworkStructure();
    await this.validateDependencies();
    await this.validateConfiguration();
    await this.validateIntegration();
    await this.validateTestingFramework();
    
    this.calculateOverallStatus();
    const result = this.generateReport();
    
    return result;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const projectIndex = args.indexOf('--project-dir');

  if (projectIndex === -1) {
    console.error('Usage: node framework-import-validator.js --project-dir ./imported-project [OPTIONS]');
    console.error('');
    console.error('Options:');
    console.error('  --verbose           Show detailed output');
    console.error('  --skip-tests        Skip testing framework validation');
    console.error('  --skip-integration  Skip integration validation');
    process.exit(1);
  }

  const projectDir = args[projectIndex + 1];
  const options = {
    verbose: args.includes('--verbose'),
    skipTests: args.includes('--skip-tests'),
    skipIntegration: args.includes('--skip-integration')
  };

  const validator = new FrameworkImportValidator(projectDir, options);
  validator.execute().then(result => {
    process.exit(result.ready ? 0 : 1);
  }).catch(error => {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  });
}

module.exports = FrameworkImportValidator;