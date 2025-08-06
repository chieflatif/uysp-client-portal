#!/usr/bin/env node

/**
 * UYSP Framework Parameter Mapping System
 * Automates project-specific parameter substitution across framework files
 * 
 * Usage: node parameter-mapping-system.js --config project-config.json --output ./new-project
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ParameterMapper {
  constructor(configPath, outputDir) {
    this.config = this.loadConfig(configPath);
    this.outputDir = outputDir;
    this.parameterMap = this.buildParameterMap();
    this.templateRoot = path.join(__dirname, '..');
  }

  loadConfig(configPath) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configContent);
    } catch (error) {
      console.error(`❌ Error loading config: ${error.message}`);
      process.exit(1);
    }
  }

  buildParameterMap() {
    const map = new Map();
    
    // Core UYSP parameters → Project parameters
    map.set('UYSP Lead Qualification V1', this.config.projectName);
    map.set('UYSP Lead Qualification', this.config.projectName);
    map.set('UYSP', this.config.projectSlug.toUpperCase());
    map.set('uysp', this.config.projectSlug.toLowerCase());
    
    // Service-specific parameters
    map.set('appuBf0fTe8tp8ZaF', this.config.services.airtable.baseId);
    map.set('CefJB1Op3OySG8nb', this.config.services.n8n.workflowId || 'NEW_WORKFLOW_ID');
    map.set('wpg9K9s8wlfofv1u', this.config.services.n8n.workflowId || 'NEW_WORKFLOW_ID');
    map.set('rebelhq.app.n8n.cloud', this.config.services.n8n.domain || 'your-n8n-instance.com');
    map.set('kajabi-leads', this.config.services.n8n.webhookPath || 'main-webhook');
    
    // Project-specific patterns
    if (this.config.customization?.patterns) {
      map.set('00-field-normalization-mandatory.txt', 
              `00-${this.config.customization.patterns[0] || 'field-normalization'}-mandatory.txt`);
    }
    
    return map;
  }

  async processDirectory(sourceDir, targetDir) {
    console.log(`📁 Processing: ${sourceDir} → ${targetDir}`);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const items = fs.readdirSync(sourceDir);
    
    for (const item of items) {
      const sourcePath = path.join(sourceDir, item);
      const targetPath = path.join(targetDir, this.substituteFileName(item));
      const stat = fs.statSync(sourcePath);

      if (stat.isDirectory()) {
        // Skip certain directories
        if (this.shouldSkipDirectory(item)) {
          console.log(`⏭️  Skipping directory: ${item}`);
          continue;
        }
        await this.processDirectory(sourcePath, targetPath);
      } else {
        await this.processFile(sourcePath, targetPath);
      }
    }
  }

  shouldSkipDirectory(dirName) {
    const skipDirs = [
      'node_modules', '.git', 'backups', 'archive', 
      'ARCHIVE', 'tests/results', 'tests/evidence'
    ];
    return skipDirs.includes(dirName);
  }

  async processFile(sourcePath, targetPath) {
    const ext = path.extname(sourcePath).toLowerCase();
    
    // Skip binary files and certain file types
    if (this.shouldSkipFile(sourcePath, ext)) {
      console.log(`⏭️  Skipping file: ${path.basename(sourcePath)}`);
      return;
    }

    try {
      let content = fs.readFileSync(sourcePath, 'utf8');
      
      // Apply parameter substitutions
      content = this.substituteParameters(content);
      
      // Write processed file
      fs.writeFileSync(targetPath, content, 'utf8');
      console.log(`✅ Processed: ${path.basename(sourcePath)}`);
    } catch (error) {
      console.log(`⚠️  Error processing ${sourcePath}: ${error.message}`);
    }
  }

  shouldSkipFile(filePath, ext) {
    const skipExts = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip'];
    const skipFiles = ['.DS_Store', 'package-lock.json', '.backup_tracker'];
    const fileName = path.basename(filePath);
    
    return skipExts.includes(ext) || skipFiles.includes(fileName);
  }

  substituteFileName(fileName) {
    let newName = fileName;
    
    // Replace UYSP in filenames
    newName = newName.replace(/UYSP/g, this.config.projectSlug.toUpperCase());
    newName = newName.replace(/uysp/g, this.config.projectSlug.toLowerCase());
    
    return newName;
  }

  substituteParameters(content) {
    let result = content;
    
    // Apply all parameter mappings
    for (const [oldValue, newValue] of this.parameterMap) {
      // Use global regex replacement
      const regex = new RegExp(this.escapeRegex(oldValue), 'g');
      result = result.replace(regex, newValue);
    }
    
    // Project description substitutions
    result = result.replace(
      /Multi-CRM data synchronization and lead routing system/g, 
      this.config.projectDescription
    );
    
    // Date stamps
    const today = new Date().toISOString().split('T')[0];
    result = result.replace(/2025-\d{2}-\d{2}/g, today);
    
    return result;
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  generateReadme() {
    const readmeTemplate = `# ${this.config.projectName}
## **Development Framework (Based on UYSP)**

**Project**: ${this.config.projectDescription}  
**Framework Source**: UYSP Lead Qualification V1  
**Adaptation Date**: ${new Date().toISOString().split('T')[0]}

---

## 🚀 **Quick Start**

\`\`\`bash
# Initialize work session
npm run start-work

# Create feature branch
npm run branch new feature-name 'Description'

# Export current state
npm run real-backup
\`\`\`

## 📋 **Service Configuration**

### **n8n Workflow**
- **Primary Workflow**: ${this.config.services.n8n.workflowId || 'CONFIGURE_AFTER_SETUP'}
- **Webhook Endpoint**: https://${this.config.services.n8n.domain || 'your-domain'}/webhook/${this.config.services.n8n.webhookPath}

### **Airtable Database**
- **Base ID**: ${this.config.services.airtable.baseId || 'CONFIGURE_AFTER_SETUP'}
- **Key Tables**: ${this.config.services.airtable.keyTables ? this.config.services.airtable.keyTables.join(', ') : 'Configure based on your needs'}

### **Integrations**
${this.config.services.integrations ? 
  this.config.services.integrations.map(service => `- ${service}`).join('\n') : 
  '- Configure based on your project requirements'
}

---

## 🎯 **Development Patterns**

### **Core Patterns Adapted**
${this.config.customization?.patterns ? 
  this.config.customization.patterns.map((pattern, i) => `${String(i).padStart(2, '0')}. ${pattern}`).join('\n') :
  '00. field-normalization-mandatory\n01. core-integration-patterns\n02. error-handling-patterns'
}

### **Testing Focus Areas**
${this.config.customization?.testingFocus ? 
  this.config.customization.testingFocus.map(area => `- ${area}`).join('\n') :
  '- Field mapping validation\n- Integration testing\n- Error handling'
}

---

## 📖 **Framework Documentation**

- **Customization Guide**: \`templates/project-customization-guide.md\`
- **Pattern Documentation**: \`patterns/\` directory
- **Testing Guide**: \`tests/README.md\`
- **MCP Tools**: \`docs/MCP-TOOL-SPECIFICATIONS-COMPLETE.md\`

---

## 🔧 **Next Steps**

1. **Configure Services**: Update IDs in config files
2. **Adapt Patterns**: Modify \`patterns/00-*\` for your data structure
3. **Setup Testing**: Configure test categories for your use case
4. **Deploy Workflow**: Import and configure n8n workflow
5. **Validate System**: Run comprehensive test suite

**Framework Adaptation Confidence**: 95% - Systematic template with proven patterns`;

    const readmePath = path.join(this.outputDir, 'README.md');
    fs.writeFileSync(readmePath, readmeTemplate, 'utf8');
    console.log(`✅ Generated project README: ${readmePath}`);
  }

  generateConfigScript() {
    const scriptContent = `#!/bin/bash

# ${this.config.projectName} - Configuration Script
# Generated from UYSP Framework Parameter Mapping System

set -e

echo "🚀 ${this.config.projectName} Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verify required configuration
if [ -z "${this.config.services.airtable.baseId}" ] || [ "${this.config.services.airtable.baseId}" = "CONFIGURE_AFTER_SETUP" ]; then
  echo "⚠️  Please configure Airtable Base ID in project config"
  echo "   Current: ${this.config.services.airtable.baseId || 'Not set'}"
  echo "   Update in: config/project-config.json"
fi

if [ -z "${this.config.services.n8n.workflowId}" ] || [ "${this.config.services.n8n.workflowId}" = "NEW_WORKFLOW_ID" ]; then
  echo "⚠️  Please configure n8n Workflow ID after import"
  echo "   Update in: config/project-config.json"
fi

echo ""
echo "📋 Configuration Summary:"
echo "Project: ${this.config.projectName}"
echo "Description: ${this.config.projectDescription}"
echo "Airtable Base: ${this.config.services.airtable.baseId || 'NOT_CONFIGURED'}"
echo "n8n Workflow: ${this.config.services.n8n.workflowId || 'NOT_CONFIGURED'}"
echo "Webhook Path: /${this.config.services.n8n.webhookPath || 'main-webhook'}"

echo ""
echo "✅ Configuration script complete"
echo "Next: Run 'npm run start-work' to begin development"`;

    const scriptPath = path.join(this.outputDir, 'scripts', 'configure.sh');
    fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
    fs.writeFileSync(scriptPath, scriptContent, 'utf8');
    fs.chmodSync(scriptPath, '755');
    console.log(`✅ Generated configuration script: ${scriptPath}`);
  }

  async execute() {
    console.log('🎨 UYSP Framework Parameter Mapping System');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📁 Source: ${this.templateRoot}`);
    console.log(`📁 Target: ${this.outputDir}`);
    console.log(`📋 Project: ${this.config.projectName}`);
    console.log('');

    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Copy project config to output
    const configPath = path.join(this.outputDir, 'config', 'project-config.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));

    // Process framework files
    await this.processDirectory(this.templateRoot, this.outputDir);

    // Generate project-specific files
    this.generateReadme();
    this.generateConfigScript();

    console.log('');
    console.log('🎯 Parameter Mapping Complete!');
    console.log(`📁 New project ready at: ${this.outputDir}`);
    console.log('📋 Next steps:');
    console.log('   1. cd ' + this.outputDir);
    console.log('   2. npm install');
    console.log('   3. ./scripts/configure.sh');
    console.log('   4. npm run start-work');
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const configIndex = args.indexOf('--config');
  const outputIndex = args.indexOf('--output');

  if (configIndex === -1 || outputIndex === -1) {
    console.error('Usage: node parameter-mapping-system.js --config project-config.json --output ./new-project');
    process.exit(1);
  }

  const configPath = args[configIndex + 1];
  const outputDir = args[outputIndex + 1];

  const mapper = new ParameterMapper(configPath, outputDir);
  mapper.execute().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = ParameterMapper;