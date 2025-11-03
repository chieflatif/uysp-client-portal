# IMPORT WORKFLOW GUIDE - Setting Up UYSP Framework in New Project

## **🎯 OVERVIEW**

This guide helps you import and set up the UYSP Development Framework in your new project, preparing it for AI-driven customization.

## **📋 PREREQUISITES**

### **Required Software**
- Node.js 18+ and npm
- Git version control
- Access to n8n instance (cloud or self-hosted)
- Airtable account (Team plan recommended)
- Code editor (VS Code, Cursor, etc.)

### **Required Information**
- n8n workspace URL and credentials
- Airtable API key and workspace ID
- Project documentation (requirements, blueprint, dev plan)

### **MCP Tools (If Available)**
- n8n MCP suite (39 tools)
- Airtable MCP suite (13 tools)
- Context7 HTTP (documentation enhancement)
- Claude Code Server MCP (fallback)

---

## **🚀 QUICK START (5 MINUTES)**

### **Step 1: Import Framework**
```bash
# Create new project directory
mkdir "My-New-Project"
cd "My-New-Project"

# Copy UYSP framework export
cp -r "/path/to/UYSP/framework-export/"* .

# Initialize project
npm init -y
git init
```

### **Step 2: Run Setup Script**
```bash
# Make setup script executable
chmod +x scripts/setup-imported-framework.sh

# Run automated setup
./scripts/setup-imported-framework.sh
```

### **Step 3: Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
# - N8N_WORKSPACE_URL=https://your-n8n-instance.com
# - AIRTABLE_API_KEY=your_api_key
# - AIRTABLE_WORKSPACE_ID=your_workspace_id
```

### **Step 4: Validate Import**
```bash
# Run framework validation
node tools/validate-imported-framework.js

# Check MCP tools (if available)
node tools/verify-mcp-connectivity.js
```

### **Step 5: Start AI Customization**
```bash
# Load AI agent instructions
cat docs/AI-AGENT-INSTRUCTIONS.md

# Upload your project documents and begin customization
```

---

## **📖 DETAILED SETUP PROCESS**

### **PHASE 1: FRAMEWORK IMPORT**

#### **Directory Structure After Import**
```
My-New-Project/
├── docs/                           # Framework documentation
│   ├── AI-AGENT-INSTRUCTIONS.md    # Instructions for AI customization
│   ├── IMPORT-WORKFLOW-GUIDE.md    # This guide
│   └── architecture/               # Technical architecture docs
├── scripts/                        # Automation scripts
│   ├── setup-imported-framework.sh # Initial setup automation
│   ├── framework-export.sh         # Export capability for further reuse
│   └── backup-scripts/             # Git and n8n backup utilities
├── .cursorrules/                   # AI agent rules and protocols
│   ├── 00-CRITICAL-ALWAYS.md      # Universal anti-hallucination rules
│   ├── PM/                         # Project Manager agent context
│   ├── TESTING/                    # Testing agent context
│   └── DEVELOPER/                  # Developer agent context
├── context/                        # Agent context loaders
├── patterns/                       # Proven development patterns
│   ├── 00-field-normalization-mandatory.txt
│   ├── 01-core-patterns.txt
│   └── [more patterns]
├── tests/                          # Testing framework
│   ├── validation/                 # Framework validation tests
│   └── templates/                  # Test template generators
├── tools/                          # Development tools
│   ├── validate-imported-framework.js
│   └── deployment-verification-system.js
└── memory_bank/                    # Project context storage
```

#### **Validation Checklist**
After import, verify these components exist:
- [ ] **Core Rules**: `.cursorrules/00-CRITICAL-ALWAYS.md`
- [ ] **Agent Context**: `context/PM/`, `context/TESTING/`, `context/DEVELOPER/`
- [ ] **Patterns**: `patterns/00-field-normalization-mandatory.txt`
- [ ] **Scripts**: `scripts/setup-imported-framework.sh`
- [ ] **Tools**: `tools/validate-imported-framework.js`
- [ ] **Documentation**: `docs/AI-AGENT-INSTRUCTIONS.md`

### **PHASE 2: ENVIRONMENT CONFIGURATION**

#### **Environment Variables**
Create `.env` file with project-specific values:
```bash
# Project Identity
PROJECT_NAME="Your Project Name"
PROJECT_SLUG="your-project-slug"

# n8n Configuration
N8N_WORKSPACE_URL="https://your-n8n-instance.com"
N8N_WORKSPACE_ID="your_workspace_id"
N8N_API_KEY="your_n8n_api_key"

# Airtable Configuration
AIRTABLE_API_KEY="your_airtable_api_key"
AIRTABLE_WORKSPACE_ID="your_workspace_id"
AIRTABLE_BASE_ID="will_be_created_during_setup"

# Integration APIs (add as needed)
STRIPE_API_KEY=""
SENDGRID_API_KEY=""
SLACK_WEBHOOK_URL=""

# Development Settings
NODE_ENV="development"
LOG_LEVEL="info"
BACKUP_ENABLED="true"
```

#### **Package Dependencies**
Update `package.json` with project-specific dependencies:
```json
{
  "name": "your-project-name",
  "scripts": {
    "start": "node scripts/start-development.js",
    "test": "node tests/run-validation-suite.js",
    "backup": "node scripts/backup-system.js",
    "deploy": "node scripts/deploy-to-production.js"
  },
  "dependencies": {
    "axios": "^1.0.0",
    "dotenv": "^16.0.0"
  }
}
```

### **PHASE 3: FRAMEWORK VALIDATION**

#### **Automated Validation**
```bash
# Run comprehensive validation
node tools/validate-imported-framework.js

# Expected output:
# ✅ Directory structure complete
# ✅ Core patterns present
# ✅ Agent context loaded
# ✅ Anti-hallucination protocols active
# ✅ MCP tools connectivity verified
# ✅ Environment configuration valid
```

#### **Manual Validation Checklist**
- [ ] **Git Repository**: Initialized and ready for commits
- [ ] **Environment**: `.env` file configured with your credentials
- [ ] **Dependencies**: `npm install` completes without errors
- [ ] **Scripts**: All scripts have execute permissions
- [ ] **MCP Tools**: Connectivity verified (if available)
- [ ] **Documentation**: AI instructions accessible and readable

### **PHASE 4: PROJECT PREPARATION**

#### **Document Organization**
Create project-specific document structure:
```
project-docs/
├── requirements/
│   ├── product-requirements.md     # Your product requirements
│   ├── technical-requirements.md   # Technical specifications
│   └── business-requirements.md    # Business logic and processes
├── architecture/
│   ├── system-architecture.md      # Overall system design
│   ├── data-architecture.md        # Data models and flows
│   └── integration-architecture.md # External system connections
├── planning/
│   ├── development-plan.md         # Project timeline and phases
│   ├── resource-plan.md            # Team and resource allocation
│   └── risk-assessment.md          # Known risks and mitigation
└── examples/
    ├── sample-data.json            # Representative data samples
    └── workflow-examples.md        # Example business processes
```

#### **AI Agent Preparation**
Before starting AI customization:

1. **Gather Project Documents**: Collect all requirements, architecture, and planning documents
2. **Prepare Sample Data**: Create representative data examples
3. **Define Success Criteria**: What does "done" look like for your project?
4. **Review AI Instructions**: Read `docs/AI-AGENT-INSTRUCTIONS.md` thoroughly
5. **Plan Customization Phases**: Break customization into manageable chunks

---

## **🎛️ CUSTOMIZATION WORKFLOW**

### **Phase 1: Document Analysis**
```bash
# Upload your project documents to AI agent
# AI agent will analyze:
# - Product requirements document
# - Architecture blueprint
# - Development plan
# - Business logic specifications

# AI agent creates:
# - Requirements analysis summary
# - Customization plan
# - Implementation roadmap
```

### **Phase 2: Framework Customization**
```bash
# AI agent customizes:
# - Field normalization patterns (for your data)
# - Workflow templates (for your processes)
# - Database schema (for your entities)
# - Testing scenarios (for your use cases)
# - Documentation (for your project)
```

### **Phase 3: Validation & Testing**
```bash
# Run customized validation
node tools/validate-customized-framework.js

# Test with your sample data
node tests/test-with-project-data.js

# Verify integration points
node tests/verify-integrations.js
```

### **Phase 4: Deployment Preparation**
```bash
# Generate deployment artifacts
node tools/generate-deployment-package.js

# Create environment-specific configs
node tools/create-environment-configs.js

# Prepare handover documentation
node tools/generate-handover-docs.js
```

---

## **🚨 TROUBLESHOOTING**

### **Common Import Issues**

#### **Missing Files**
**Problem**: Some framework files missing after import
**Solution**: 
```bash
# Verify source framework export
ls -la framework-export/
# Re-run import with verbose output
cp -rv framework-export/* .
```

#### **Permission Issues**
**Problem**: Scripts not executable
**Solution**:
```bash
# Fix script permissions
find scripts/ -name "*.sh" -exec chmod +x {} \;
find tools/ -name "*.js" -exec chmod +x {} \;
```

#### **Environment Configuration**
**Problem**: Environment variables not loading
**Solution**:
```bash
# Verify .env file exists and format
cat .env
# Test environment loading
node -e "require('dotenv').config(); console.log(process.env.PROJECT_NAME);"
```

#### **MCP Tools Not Available**
**Problem**: MCP tools not accessible
**Solution**: 
```bash
# MCP tools are user environment specific
# Framework works without MCP tools (manual alternative provided)
# Focus on framework customization, tools are enhancement only
```

### **Validation Failures**

#### **Framework Structure**
**Problem**: Validation reports missing components
**Solution**: 
```bash
# Check against required structure
node tools/validate-imported-framework.js --verbose
# Review missing components and re-import if needed
```

#### **Dependency Issues**
**Problem**: npm install fails
**Solution**:
```bash
# Clear npm cache
npm cache clean --force
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## **✅ SUCCESS CRITERIA**

### **Import Success Indicators**
- ✅ **Framework Structure Complete**: All directories and core files present
- ✅ **Environment Configured**: `.env` file created with project values
- ✅ **Dependencies Installed**: `npm install` completes successfully
- ✅ **Scripts Executable**: All automation scripts have proper permissions
- ✅ **Validation Passes**: Framework validation reports all components ready
- ✅ **Documentation Accessible**: AI instructions and guides are readable

### **Ready for Customization**
- ✅ **Project Documents Prepared**: Requirements, architecture, and planning docs ready
- ✅ **AI Agent Instructions Understood**: Customization workflow clear
- ✅ **Sample Data Available**: Representative data for testing
- ✅ **Success Criteria Defined**: Clear definition of completion
- ✅ **Backup Strategy**: Git repository initialized for change tracking

---

## **🔄 NEXT STEPS**

After successful import and validation:

1. **Review AI Agent Instructions**: Thoroughly read `docs/AI-AGENT-INSTRUCTIONS.md`
2. **Prepare Project Documents**: Organize requirements, architecture, and planning materials
3. **Start AI Customization**: Upload documents and begin intelligent framework adaptation
4. **Validate Customizations**: Test adapted framework with your project data
5. **Deploy to Development**: Set up development environment with customized framework
6. **Team Handover**: Transfer customized system to development team

**Estimated Timeline**: Import (30 minutes) + Customization (2-4 hours) + Validation (1 hour) = Same-day project-ready framework

**Support**: Reference framework documentation in `docs/` directory for detailed guidance on specific components.