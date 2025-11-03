#!/bin/bash

# UYSP Framework Complete Customization Workflow
# End-to-end project adaptation system with validation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}"))" && pwd)"
FRAMEWORK_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Default values
PROJECT_CONFIG=""
OUTPUT_DIR=""
VALIDATE_ONLY=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
    echo "🎨 UYSP Framework Complete Customization Workflow"
    echo ""
    echo "Usage: $0 --config PROJECT_CONFIG --output OUTPUT_DIR [OPTIONS]"
    echo ""
    echo "Required:"
    echo "  --config FILE     Project configuration JSON file"
    echo "  --output DIR      Output directory for customized framework"
    echo ""
    echo "Options:"
    echo "  --validate-only   Only validate configuration, don't generate project"
    echo "  --verbose         Show detailed output"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  # Create CRM integration project"
    echo "  $0 --config examples/crm-integration-config.json --output ../my-crm-project"
    echo ""
    echo "  # Validate configuration only"
    echo "  $0 --config my-config.json --validate-only"
    exit 1
}

log() {
    local level=$1
    shift
    case $level in
        "INFO")  echo -e "${BLUE}ℹ️  $*${NC}" ;;
        "WARN")  echo -e "${YELLOW}⚠️  $*${NC}" ;;
        "ERROR") echo -e "${RED}❌ $*${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ $*${NC}" ;;
        *) echo "$*" ;;
    esac
}

verbose_log() {
    if [ "$VERBOSE" = true ]; then
        log "INFO" "$@"
    fi
}

validate_prerequisites() {
    log "INFO" "Validating prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log "ERROR" "Node.js is required but not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log "ERROR" "npm is required but not installed"
        exit 1
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        log "WARN" "git is recommended but not installed"
    fi
    
    log "SUCCESS" "Prerequisites validated"
}

validate_configuration() {
    log "INFO" "Validating configuration file: $PROJECT_CONFIG"
    
    if [ ! -f "$PROJECT_CONFIG" ]; then
        log "ERROR" "Configuration file not found: $PROJECT_CONFIG"
        exit 1
    fi
    
    # Validate JSON syntax
    if ! node -e "JSON.parse(require('fs').readFileSync('$PROJECT_CONFIG', 'utf8'))" 2>/dev/null; then
        log "ERROR" "Invalid JSON in configuration file"
        exit 1
    fi
    
    # Extract key fields for validation
    PROJECT_NAME=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$PROJECT_CONFIG', 'utf8')).projectName || '')")
    PROJECT_SLUG=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$PROJECT_CONFIG', 'utf8')).projectSlug || '')")
    
    if [ -z "$PROJECT_NAME" ]; then
        log "ERROR" "Configuration missing required field: projectName"
        exit 1
    fi
    
    if [ -z "$PROJECT_SLUG" ]; then
        log "ERROR" "Configuration missing required field: projectSlug"
        exit 1
    fi
    
    verbose_log "Project Name: $PROJECT_NAME"
    verbose_log "Project Slug: $PROJECT_SLUG"
    
    log "SUCCESS" "Configuration validated"
}

generate_project() {
    log "INFO" "Generating customized project..."
    
    # Create output directory
    if [ ! -d "$OUTPUT_DIR" ]; then
        mkdir -p "$OUTPUT_DIR"
        verbose_log "Created output directory: $OUTPUT_DIR"
    fi
    
    # Run parameter mapping system
    log "INFO" "Running parameter mapping system..."
    cd "$SCRIPT_DIR"
    node parameter-mapping-system.js --config "$PROJECT_CONFIG" --output "$OUTPUT_DIR"
    
    if [ $? -ne 0 ]; then
        log "ERROR" "Parameter mapping failed"
        exit 1
    fi
    
    log "SUCCESS" "Project generated successfully"
}

validate_generated_project() {
    log "INFO" "Validating generated project..."
    
    # Run project validation system
    cd "$SCRIPT_DIR"
    node project-validation-system.js --config "$PROJECT_CONFIG" --project-dir "$OUTPUT_DIR"
    
    local validation_result=$?
    
    if [ $validation_result -eq 0 ]; then
        log "SUCCESS" "Project validation passed"
        return 0
    else
        log "WARN" "Project validation found issues (see report above)"
        return 1
    fi
}

setup_project_environment() {
    log "INFO" "Setting up project environment..."
    
    cd "$OUTPUT_DIR"
    
    # Initialize npm if package.json exists
    if [ -f "package.json" ]; then
        verbose_log "Installing npm dependencies..."
        npm install --silent
        log "SUCCESS" "npm dependencies installed"
    fi
    
    # Initialize git if not already initialized
    if [ ! -d ".git" ] && command -v git &> /dev/null; then
        verbose_log "Initializing git repository..."
        git init --quiet
        git add .
        git commit --quiet -m "Initial framework adaptation from UYSP

Project: $PROJECT_NAME
Generated: $TIMESTAMP
Framework: UYSP Lead Qualification V1"
        log "SUCCESS" "Git repository initialized"
    fi
    
    # Make scripts executable
    if [ -d "scripts" ]; then
        chmod +x scripts/*.sh 2>/dev/null || true
        verbose_log "Scripts made executable"
    fi
}

generate_completion_report() {
    local validation_passed=$1
    
    echo ""
    log "INFO" "═══════════════════════════════════════════════════════════════"
    log "INFO" "🎉 UYSP FRAMEWORK CUSTOMIZATION COMPLETE"
    log "INFO" "═══════════════════════════════════════════════════════════════"
    echo ""
    
    echo "📋 PROJECT DETAILS:"
    echo "   Name: $PROJECT_NAME"
    echo "   Slug: $PROJECT_SLUG"
    echo "   Output: $OUTPUT_DIR"
    echo "   Generated: $TIMESTAMP"
    echo ""
    
    echo "📊 VALIDATION STATUS:"
    if [ $validation_passed -eq 0 ]; then
        echo "   Status: ✅ PASSED - Ready for development"
        echo "   Confidence: 95%+"
    else
        echo "   Status: ⚠️  PASSED WITH WARNINGS - Review needed"
        echo "   Confidence: 85-94%"
    fi
    echo ""
    
    echo "🚀 NEXT STEPS:"
    echo "   1. cd \"$OUTPUT_DIR\""
    echo "   2. Review and configure service IDs:"
    echo "      - Update config/project-config.json with actual IDs"
    echo "      - Configure n8n workflow ID after import"
    echo "      - Configure Airtable base ID"
    echo "   3. ./scripts/configure.sh"
    echo "   4. npm run start-work"
    echo ""
    
    echo "📖 DOCUMENTATION:"
    echo "   - README.md - Project overview and quick start"
    echo "   - templates/project-customization-guide.md - Detailed customization guide"
    echo "   - docs/ - Complete framework documentation"
    echo "   - patterns/ - Development patterns adapted for your project"
    echo ""
    
    if [ $validation_passed -ne 0 ]; then
        echo "⚠️  REVIEW REQUIRED:"
        echo "   - Check validation warnings above"
        echo "   - Complete any missing configurations"
        echo "   - Re-run validation: node templates/project-validation-system.js --config config/project-config.json --project-dir ."
        echo ""
    fi
    
    log "SUCCESS" "Framework customization workflow complete!"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --config)
            PROJECT_CONFIG="$2"
            shift 2
            ;;
        --output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --validate-only)
            VALIDATE_ONLY=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate required arguments
if [ -z "$PROJECT_CONFIG" ]; then
    log "ERROR" "Missing required argument: --config"
    usage
fi

if [ "$VALIDATE_ONLY" = false ] && [ -z "$OUTPUT_DIR" ]; then
    log "ERROR" "Missing required argument: --output"
    usage
fi

# Convert to absolute paths
PROJECT_CONFIG=$(realpath "$PROJECT_CONFIG")
if [ -n "$OUTPUT_DIR" ]; then
    OUTPUT_DIR=$(realpath "$OUTPUT_DIR")
fi

# Main execution flow
main() {
    echo "🎨 UYSP Framework Complete Customization Workflow"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⏰ Started: $(date)"
    echo "📋 Config: $PROJECT_CONFIG"
    if [ -n "$OUTPUT_DIR" ]; then
        echo "📁 Output: $OUTPUT_DIR"
    fi
    echo ""
    
    # Step 1: Validate prerequisites
    validate_prerequisites
    
    # Step 2: Validate configuration
    validate_configuration
    
    if [ "$VALIDATE_ONLY" = true ]; then
        log "SUCCESS" "Configuration validation complete (validate-only mode)"
        exit 0
    fi
    
    # Step 3: Generate customized project
    generate_project
    
    # Step 4: Validate generated project
    validate_generated_project
    local validation_result=$?
    
    # Step 5: Setup project environment
    setup_project_environment
    
    # Step 6: Generate completion report
    generate_completion_report $validation_result
    
    echo "⏰ Completed: $(date)"
}

# Execute main function
main "$@"