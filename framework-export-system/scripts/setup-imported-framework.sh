#!/bin/bash

# UYSP Framework Import Setup Script
# Automates initial setup after framework import into new project

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 UYSP FRAMEWORK IMPORT SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 Timestamp: $TIMESTAMP"
echo "📂 Project Root: $PROJECT_ROOT"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create directory if it doesn't exist
ensure_directory() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        echo "✅ Created directory: $1"
    else
        echo "📁 Directory exists: $1"
    fi
}

# Function to copy file if source exists
copy_if_exists() {
    if [ -f "$1" ]; then
        cp "$1" "$2"
        echo "✅ Copied: $1 → $2"
    else
        echo "⚠️  Source not found: $1"
    fi
}

echo "🔍 STEP 1: ENVIRONMENT VALIDATION"
echo "──────────────────────────────────────"

# Check required tools
echo "Checking required tools..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js not found - please install Node.js 18+"
    exit 1
fi

if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm not found - please install npm"
    exit 1
fi

if command_exists git; then
    GIT_VERSION=$(git --version)
    echo "✅ Git: $GIT_VERSION"
else
    echo "❌ Git not found - please install Git"
    exit 1
fi

echo ""
echo "🏗️  STEP 2: PROJECT STRUCTURE SETUP"
echo "──────────────────────────────────────"

# Ensure project directories exist
ensure_directory "$PROJECT_ROOT/project-docs"
ensure_directory "$PROJECT_ROOT/project-docs/requirements"
ensure_directory "$PROJECT_ROOT/project-docs/architecture"
ensure_directory "$PROJECT_ROOT/project-docs/planning"
ensure_directory "$PROJECT_ROOT/project-docs/examples"

ensure_directory "$PROJECT_ROOT/customized-framework"
ensure_directory "$PROJECT_ROOT/validation-results"
ensure_directory "$PROJECT_ROOT/deployment-artifacts"

echo ""
echo "📝 STEP 3: CONFIGURATION TEMPLATES"
echo "──────────────────────────────────────"

# Create .env template if it doesn't exist
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    cat > "$PROJECT_ROOT/.env" << 'EOF'
# Project Configuration
PROJECT_NAME="Your Project Name"
PROJECT_SLUG="your-project-slug"
PROJECT_DESCRIPTION="Your project description"

# n8n Configuration
N8N_WORKSPACE_URL="https://your-n8n-instance.com"
N8N_WORKSPACE_ID="your_workspace_id"
N8N_API_KEY="your_n8n_api_key"

# Airtable Configuration  
AIRTABLE_API_KEY="your_airtable_api_key"
AIRTABLE_WORKSPACE_ID="your_workspace_id"
AIRTABLE_BASE_ID="will_be_created_during_setup"

# Integration APIs (configure as needed)
STRIPE_API_KEY=""
SENDGRID_API_KEY=""
SLACK_WEBHOOK_URL=""

# Development Settings
NODE_ENV="development"
LOG_LEVEL="info"
BACKUP_ENABLED="true"
EOF
    echo "✅ Created .env template - please configure with your values"
else
    echo "📁 .env file already exists"
fi

# Create package.json if it doesn't exist
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    cat > "$PROJECT_ROOT/package.json" << 'EOF'
{
  "name": "imported-uysp-framework",
  "version": "1.0.0",
  "description": "UYSP Development Framework - Customized for this project",
  "main": "index.js",
  "scripts": {
    "start": "node scripts/start-development.js",
    "test": "node tests/run-validation-suite.js",
    "validate": "node tools/validate-imported-framework.js",
    "backup": "node scripts/backup-system.js",
    "deploy": "node scripts/deploy-to-production.js",
    "ai-customize": "echo 'Upload your project documents and run AI customization - see docs/AI-AGENT-INSTRUCTIONS.md'"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.3.0",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  },
  "keywords": ["uysp", "framework", "n8n", "airtable", "automation"],
  "author": "Your Team",
  "license": "ISC"
}
EOF
    echo "✅ Created package.json template"
else
    echo "📁 package.json already exists"
fi

# Create README.md if it doesn't exist
if [ ! -f "$PROJECT_ROOT/README.md" ]; then
    cat > "$PROJECT_ROOT/README.md" << 'EOF'
# UYSP Framework - Imported Project

This project has imported the UYSP Development Framework and is ready for AI-driven customization.

## Quick Start

1. **Configure Environment**: Edit `.env` file with your credentials
2. **Install Dependencies**: `npm install`
3. **Validate Import**: `npm run validate`
4. **Start AI Customization**: Follow `docs/AI-AGENT-INSTRUCTIONS.md`

## Next Steps

1. Upload your project documents (requirements, architecture, dev plan)
2. Use the AI customization prompt from `templates/ai-customization-prompt.txt`
3. Let the AI agent analyze and customize the framework for your needs
4. Validate the customizations and deploy to your development environment

## Documentation

- `docs/AI-AGENT-INSTRUCTIONS.md` - Complete AI customization guide
- `docs/IMPORT-WORKFLOW-GUIDE.md` - Detailed import and setup instructions
- `docs/AI-CUSTOMIZATION-EXAMPLES.md` - Real-world customization examples

## Support

Reference the documentation in the `docs/` directory for detailed guidance on framework components and customization processes.
EOF
    echo "✅ Created README.md with getting started guide"
else
    echo "📁 README.md already exists"
fi

echo ""
echo "🔧 STEP 4: SCRIPT PERMISSIONS"
echo "──────────────────────────────────────"

# Make scripts executable
if [ -d "$PROJECT_ROOT/scripts" ]; then
    find "$PROJECT_ROOT/scripts" -name "*.sh" -exec chmod +x {} \;
    echo "✅ Made shell scripts executable"
fi

if [ -d "$PROJECT_ROOT/tools" ]; then
    find "$PROJECT_ROOT/tools" -name "*.js" -exec chmod +x {} \;
    echo "✅ Made tool scripts executable"
fi

echo ""
echo "📦 STEP 5: DEPENDENCY INSTALLATION"
echo "──────────────────────────────────────"

# Install npm dependencies
if [ -f "$PROJECT_ROOT/package.json" ]; then
    cd "$PROJECT_ROOT"
    echo "Installing npm dependencies..."
    npm install
    echo "✅ Dependencies installed successfully"
else
    echo "⚠️  No package.json found - skipping dependency installation"
fi

echo ""
echo "🔍 STEP 6: VALIDATION CHECK"
echo "──────────────────────────────────────"

# Run basic validation if tools exist
if [ -f "$PROJECT_ROOT/tools/validate-imported-framework.js" ]; then
    echo "Running framework validation..."
    if node "$PROJECT_ROOT/tools/validate-imported-framework.js"; then
        echo "✅ Framework validation passed"
    else
        echo "⚠️  Framework validation found issues - check output above"
    fi
else
    echo "⚠️  Validation tool not found - manual verification required"
fi

echo ""
echo "🎯 SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ UYSP Framework import setup completed successfully!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Configure .env file with your credentials"
echo "2. Review docs/AI-AGENT-INSTRUCTIONS.md for customization guide"  
echo "3. Upload your project documents and start AI customization"
echo "4. Validate customizations and deploy to development environment"
echo ""
echo "📖 DOCUMENTATION:"
echo "- AI Instructions: docs/AI-AGENT-INSTRUCTIONS.md"
echo "- Import Guide: docs/IMPORT-WORKFLOW-GUIDE.md" 
echo "- Examples: docs/AI-CUSTOMIZATION-EXAMPLES.md"
echo "- Prompt Template: templates/ai-customization-prompt.txt"
echo ""
echo "🚀 Ready for AI-driven framework customization!"

exit 0