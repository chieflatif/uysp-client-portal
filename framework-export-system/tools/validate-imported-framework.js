#!/usr/bin/env node

/**
 * UYSP Framework Import Validation Tool
 * Validates that the framework was imported correctly and is ready for AI customization
 */

const fs = require('fs');
const path = require('path');

class FrameworkValidator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.errors = [];
    this.warnings = [];
    this.validations = [];
    this.isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v');
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'warning': '⚠️ ',
      'error': '❌'
    };
    
    console.log(`${prefix[level]} ${message}`);
    
    if (this.isVerbose && level !== 'info') {
      console.log(`    [${timestamp}] ${level.toUpperCase()}: ${message}`);
    }
  }

  addValidation(name, passed, message, critical = false) {
    this.validations.push({ name, passed, message, critical });
    
    if (passed) {
      this.log(`${name}: ${message}`, 'success');
    } else {
      if (critical) {
        this.errors.push(`${name}: ${message}`);
        this.log(`${name}: ${message}`, 'error');
      } else {
        this.warnings.push(`${name}: ${message}`);
        this.log(`${name}: ${message}`, 'warning');
      }
    }
  }

  fileExists(filePath, description = '') {
    const fullPath = path.join(this.projectRoot, filePath);
    const exists = fs.existsSync(fullPath);
    const name = description || `File: ${filePath}`;
    
    if (exists && this.isVerbose) {
      const stats = fs.statSync(fullPath);
      this.addValidation(name, exists, `Found (${stats.size} bytes)`, false);
    } else {
      this.addValidation(name, exists, exists ? 'Found' : 'Missing', true);
    }
    
    return exists;
  }

  directoryExists(dirPath, description = '') {
    const fullPath = path.join(this.projectRoot, dirPath);
    const exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
    const name = description || `Directory: ${dirPath}`;
    
    if (exists && this.isVerbose) {
      const files = fs.readdirSync(fullPath);
      this.addValidation(name, exists, `Found (${files.length} items)`, false);
    } else {
      this.addValidation(name, exists, exists ? 'Found' : 'Missing', true);
    }
    
    return exists;
  }

  validateJSONFile(filePath, description = '') {
    const name = description || `JSON: ${filePath}`;
    
    if (!this.fileExists(filePath)) {
      this.addValidation(name, false, 'File missing', false);
      return false;
    }

    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      JSON.parse(content);
      this.addValidation(name, true, 'Valid JSON format', false);
      return true;
    } catch (error) {
      this.addValidation(name, false, `Invalid JSON: ${error.message}`, false);
      return false;
    }
  }

  validateExecutableScript(scriptPath, description = '') {
    const name = description || `Script: ${scriptPath}`;
    
    if (!this.fileExists(scriptPath)) {
      this.addValidation(name, false, 'File missing', false);
      return false;
    }

    try {
      const fullPath = path.join(this.projectRoot, scriptPath);
      const stats = fs.statSync(fullPath);
      const isExecutable = !!(stats.mode & parseInt('111', 8));
      
      this.addValidation(name, isExecutable, isExecutable ? 'Executable' : 'Not executable', false);
      return isExecutable;
    } catch (error) {
      this.addValidation(name, false, `Cannot check permissions: ${error.message}`, false);
      return false;
    }
  }

  validateEnvironmentTemplate() {
    const envExists = this.fileExists('.env', 'Environment Configuration');
    const envExampleExists = this.fileExists('.env.example', 'Environment Template');
    
    if (envExists) {
      try {
        const envContent = fs.readFileSync(path.join(this.projectRoot, '.env'), 'utf8');
        const hasProjectName = envContent.includes('PROJECT_NAME');
        const hasN8nConfig = envContent.includes('N8N_WORKSPACE_URL');
        const hasAirtableConfig = envContent.includes('AIRTABLE_API_KEY');
        
        this.addValidation('Environment Variables', hasProjectName && hasN8nConfig && hasAirtableConfig, 
          hasProjectName && hasN8nConfig && hasAirtableConfig ? 'Core variables present' : 'Missing core variables', false);
      } catch (error) {
        this.addValidation('Environment Validation', false, `Cannot read .env: ${error.message}`, false);
      }
    }
    
    return envExists || envExampleExists;
  }

  validatePackageJSON() {
    if (!this.validateJSONFile('package.json', 'Package Configuration')) {
      return false;
    }

    try {
      const packageContent = fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8');
      const packageJSON = JSON.parse(packageContent);
      
      const hasValidateScript = packageJSON.scripts && packageJSON.scripts.validate;
      const hasStartScript = packageJSON.scripts && packageJSON.scripts.start;
      const hasAxios = packageJSON.dependencies && packageJSON.dependencies.axios;
      const hasDotenv = packageJSON.dependencies && packageJSON.dependencies.dotenv;
      
      this.addValidation('Package Scripts', hasValidateScript && hasStartScript, 
        hasValidateScript && hasStartScript ? 'Required scripts present' : 'Missing required scripts', false);
      
      this.addValidation('Core Dependencies', hasAxios && hasDotenv, 
        hasAxios && hasDotenv ? 'Core dependencies present' : 'Missing core dependencies', false);
      
      return true;
    } catch (error) {
      this.addValidation('Package JSON Analysis', false, `Cannot analyze package.json: ${error.message}`, false);
      return false;
    }
  }

  validateCoreStructure() {
    this.log('Validating core framework structure...', 'info');
    
    // Critical directories
    this.directoryExists('docs', 'Documentation Directory');
    this.directoryExists('scripts', 'Scripts Directory');
    this.directoryExists('tools', 'Tools Directory');
    this.directoryExists('.cursorrules', 'Agent Rules Directory');
    this.directoryExists('context', 'Agent Context Directory');
    this.directoryExists('patterns', 'Development Patterns Directory');
    
    // Critical files
    this.fileExists('.cursorrules/00-CRITICAL-ALWAYS.md', 'Anti-Hallucination Rules');
    this.fileExists('patterns/00-field-normalization-mandatory.txt', 'Field Normalization Pattern');
    this.fileExists('scripts/framework-export.sh', 'Framework Export Script');
    
    // AI-specific components
    this.fileExists('docs/AI-AGENT-INSTRUCTIONS.md', 'AI Agent Instructions');
    this.fileExists('docs/IMPORT-WORKFLOW-GUIDE.md', 'Import Workflow Guide');
    this.fileExists('templates/ai-customization-prompt.txt', 'AI Customization Prompt');
  }

  validateAgentContext() {
    this.log('Validating 3-agent context system...', 'info');
    
    // Agent context directories
    this.directoryExists('context/PM', 'PM Agent Context');
    this.directoryExists('context/TESTING', 'Testing Agent Context');
    this.directoryExists('context/DEVELOPER', 'Developer Agent Context');
    
    // Agent rules
    this.directoryExists('.cursorrules/PM', 'PM Agent Rules');
    this.directoryExists('.cursorrules/TESTING', 'Testing Agent Rules');
    this.directoryExists('.cursorrules/DEVELOPER', 'Developer Agent Rules');
  }

  validateDevelopmentTools() {
    this.log('Validating development tools and scripts...', 'info');
    
    // Validation tools
    this.fileExists('tools/deployment-verification-system.js', 'Deployment Verification Tool');
    this.fileExists('tools/test-suite-adapter.js', 'Test Suite Adapter');
    
    // Scripts
    this.validateExecutableScript('scripts/setup-imported-framework.sh', 'Setup Script');
    this.validateExecutableScript('scripts/framework-export.sh', 'Export Script');
  }

  validateDocumentation() {
    this.log('Validating documentation completeness...', 'info');
    
    // AI customization documentation
    this.fileExists('docs/AI-AGENT-INSTRUCTIONS.md', 'AI Instructions');
    this.fileExists('docs/IMPORT-WORKFLOW-GUIDE.md', 'Import Guide');
    this.fileExists('docs/AI-CUSTOMIZATION-EXAMPLES.md', 'Customization Examples');
    
    // Legacy documentation (should exist but may need updates)
    this.fileExists('docs/FRAMEWORK-EXPORT-SYSTEM-GUIDE.md', 'Legacy Framework Guide');
  }

  validateProjectSetup() {
    this.log('Validating project configuration...', 'info');
    
    // Configuration files
    this.validateEnvironmentTemplate();
    this.validatePackageJSON();
    
    // Project structure
    this.directoryExists('project-docs', 'Project Documents Directory');
    this.fileExists('README.md', 'Project README');
  }

  generateReport() {
    const total = this.validations.length;
    const passed = this.validations.filter(v => v.passed).length;
    const failed = this.validations.filter(v => !v.passed).length;
    const critical = this.validations.filter(v => !v.passed && v.critical).length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FRAMEWORK IMPORT VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total Validations: ${total}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   🚨 Critical Failures: ${critical}`);
    console.log(`   📊 Success Rate: ${Math.round((passed/total) * 100)}%`);
    
    if (this.errors.length > 0) {
      console.log(`\n🚨 CRITICAL ISSUES:`);
      this.errors.forEach(error => console.log(`   ❌ ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS:`);
      this.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
    }
    
    console.log(`\n🎯 OVERALL STATUS:`);
    if (critical === 0 && passed >= total * 0.9) {
      console.log('   ✅ FRAMEWORK READY FOR AI CUSTOMIZATION');
    } else if (critical === 0) {
      console.log('   ⚠️  FRAMEWORK USABLE BUT HAS MINOR ISSUES');
    } else {
      console.log('   ❌ FRAMEWORK HAS CRITICAL ISSUES - SETUP REQUIRED');
    }
    
    console.log(`\n📖 NEXT STEPS:`);
    if (critical === 0) {
      console.log('   1. Review and resolve any warnings');
      console.log('   2. Configure .env file with your credentials');
      console.log('   3. Read docs/AI-AGENT-INSTRUCTIONS.md');
      console.log('   4. Upload project documents and start AI customization');
    } else {
      console.log('   1. Fix critical issues listed above');
      console.log('   2. Re-run validation: npm run validate');
      console.log('   3. Review docs/IMPORT-WORKFLOW-GUIDE.md for setup help');
    }
    
    console.log('\n' + '='.repeat(60));
    
    return critical === 0;
  }

  run() {
    console.log('🚀 UYSP FRAMEWORK IMPORT VALIDATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`📂 Project Root: ${this.projectRoot}`);
    console.log(`🔍 Verbose Mode: ${this.isVerbose ? 'Enabled' : 'Disabled'}`);
    console.log('');
    
    // Run all validation categories
    this.validateCoreStructure();
    this.validateAgentContext();
    this.validateDevelopmentTools();
    this.validateDocumentation();
    this.validateProjectSetup();
    
    // Generate final report
    const success = this.generateReport();
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1);
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new FrameworkValidator();
  validator.run();
}

module.exports = FrameworkValidator;