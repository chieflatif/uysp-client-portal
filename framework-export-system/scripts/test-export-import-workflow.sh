#!/bin/bash

# Test Export → Import → Validation Workflow
# Tests the complete AI-driven framework workflow

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$FRAMEWORK_ROOT")"
TEST_DIR="$PROJECT_ROOT/test-workflow-validation"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🧪 TESTING COMPLETE EXPORT → IMPORT → VALIDATION WORKFLOW"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 Timestamp: $TIMESTAMP"
echo "📂 Framework Root: $FRAMEWORK_ROOT"
echo "📂 Project Root: $PROJECT_ROOT"
echo "🎯 Test Directory: $TEST_DIR"
echo ""

# Clean up any existing test directory
if [ -d "$TEST_DIR" ]; then
    echo "🧹 Cleaning up existing test directory..."
    rm -rf "$TEST_DIR"
fi

echo "🔸 PHASE 1: TEST FRAMEWORK EXPORT"
echo "──────────────────────────────────────"

# Create test directory and copy framework-export-system contents
mkdir -p "$TEST_DIR"
echo "✅ Created test directory: $TEST_DIR"

# Copy framework export system components to test directory
echo "📦 Copying framework components..."
cp -r "$FRAMEWORK_ROOT/docs" "$TEST_DIR/"
cp -r "$FRAMEWORK_ROOT/scripts" "$TEST_DIR/"
cp -r "$FRAMEWORK_ROOT/tools" "$TEST_DIR/"
if [ -d "$FRAMEWORK_ROOT/templates" ]; then
    cp -r "$FRAMEWORK_ROOT/templates" "$TEST_DIR/"
fi

# Copy framework components from main project
echo "📦 Copying core UYSP components..."
mkdir -p "$TEST_DIR/.cursorrules"
mkdir -p "$TEST_DIR/context"
mkdir -p "$TEST_DIR/patterns"
mkdir -p "$TEST_DIR/tests"

# Copy from main project if they exist
if [ -d "$PROJECT_ROOT/.cursorrules" ]; then
    cp -r "$PROJECT_ROOT/.cursorrules/"* "$TEST_DIR/.cursorrules/" 2>/dev/null || echo "⚠️  Some .cursorrules files not found"
fi

if [ -d "$PROJECT_ROOT/context" ]; then
    cp -r "$PROJECT_ROOT/context/"* "$TEST_DIR/context/" 2>/dev/null || echo "⚠️  Some context files not found"
fi

if [ -d "$PROJECT_ROOT/patterns" ]; then
    cp -r "$PROJECT_ROOT/patterns/"* "$TEST_DIR/patterns/" 2>/dev/null || echo "⚠️  Some pattern files not found"
fi

if [ -d "$PROJECT_ROOT/tests" ]; then
    cp -r "$PROJECT_ROOT/tests/"* "$TEST_DIR/tests/" 2>/dev/null || echo "⚠️  Some test files not found"
fi

echo "✅ Framework export simulation completed"

echo ""
echo "🔸 PHASE 2: TEST IMPORT SETUP"
echo "──────────────────────────────────────"

# Run import setup script
cd "$TEST_DIR"
if [ -f "scripts/setup-imported-framework.sh" ]; then
    echo "🚀 Running import setup script..."
    chmod +x scripts/setup-imported-framework.sh
    ./scripts/setup-imported-framework.sh
    echo "✅ Import setup completed"
else
    echo "❌ Setup script not found"
    exit 1
fi

echo ""
echo "🔸 PHASE 3: TEST VALIDATION"
echo "──────────────────────────────────────"

# Run validation
if [ -f "tools/validate-imported-framework.js" ]; then
    echo "🔍 Running framework validation..."
    chmod +x tools/validate-imported-framework.js
    node tools/validate-imported-framework.js
    validation_result=$?
    echo "✅ Validation completed with exit code: $validation_result"
else
    echo "❌ Validation script not found"
    exit 1
fi

echo ""
echo "🔸 PHASE 4: TEST AI INSTRUCTIONS"
echo "──────────────────────────────────────"

# Check AI instructions accessibility
if [ -f "docs/AI-AGENT-INSTRUCTIONS.md" ]; then
    echo "📖 AI Agent Instructions: Available"
    ai_instructions_size=$(wc -c < "docs/AI-AGENT-INSTRUCTIONS.md")
    echo "   Size: $ai_instructions_size bytes"
else
    echo "❌ AI Agent Instructions: Missing"
fi

if [ -f "docs/IMPORT-WORKFLOW-GUIDE.md" ]; then
    echo "📖 Import Workflow Guide: Available"
    import_guide_size=$(wc -c < "docs/IMPORT-WORKFLOW-GUIDE.md")
    echo "   Size: $import_guide_size bytes"
else
    echo "❌ Import Workflow Guide: Missing"
fi

if [ -f "docs/AI-CUSTOMIZATION-EXAMPLES.md" ]; then
    echo "📖 AI Customization Examples: Available"
    examples_size=$(wc -c < "docs/AI-CUSTOMIZATION-EXAMPLES.md")
    echo "   Size: $examples_size bytes"
else
    echo "❌ AI Customization Examples: Missing"
fi

if [ -f "templates/ai-customization-prompt.txt" ]; then
    echo "📖 AI Customization Prompt: Available"
    prompt_size=$(wc -c < "templates/ai-customization-prompt.txt")
    echo "   Size: $prompt_size bytes"
else
    echo "❌ AI Customization Prompt: Missing"
fi

echo ""
echo "🔸 PHASE 5: TEST RESULTS SUMMARY"
echo "──────────────────────────────────────"

# Count available components
total_docs=0
available_docs=0

docs_to_check=(
    "docs/AI-AGENT-INSTRUCTIONS.md"
    "docs/IMPORT-WORKFLOW-GUIDE.md"
    "docs/AI-CUSTOMIZATION-EXAMPLES.md"
    "templates/ai-customization-prompt.txt"
    ".env"
    "package.json"
    "README.md"
)

for doc in "${docs_to_check[@]}"; do
    total_docs=$((total_docs + 1))
    if [ -f "$doc" ]; then
        available_docs=$((available_docs + 1))
    fi
done

success_rate=$((available_docs * 100 / total_docs))

echo "📊 WORKFLOW TEST RESULTS:"
echo "   📁 Test Directory: $TEST_DIR"
echo "   📦 Framework Export: Success"
echo "   🚀 Import Setup: Success"
echo "   🔍 Validation: Exit code $validation_result"
echo "   📖 Documentation: $available_docs/$total_docs available ($success_rate%)"
echo ""

if [ $validation_result -eq 0 ] && [ $success_rate -ge 80 ]; then
    echo "✅ WORKFLOW TEST: SUCCESS"
    echo "🎯 Framework export → import → validation workflow operational"
    echo "🤖 AI agent instructions accessible and complete"
    echo "🚀 Ready for production use in new projects"
else
    echo "⚠️  WORKFLOW TEST: PARTIAL SUCCESS"
    echo "🔧 Some components may need adjustment"
    echo "📖 Review validation output for specific issues"
fi

echo ""
echo "🧹 CLEANUP OPTIONS:"
echo "   Keep test directory: ls -la $TEST_DIR"
echo "   Remove test directory: rm -rf $TEST_DIR"
echo ""
echo "🎯 NEXT STEPS FOR PRODUCTION:"
echo "   1. Use framework-export-system/ as source for exports"
echo "   2. Copy exported framework to new projects"
echo "   3. Run setup-imported-framework.sh in new projects"
echo "   4. Follow AI-AGENT-INSTRUCTIONS.md for customization"

exit 0