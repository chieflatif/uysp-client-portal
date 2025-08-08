#!/bin/bash
# COMPREHENSIVE MCP AUTOMATED TESTING RUNNER
# Replaces manual 30-minute testing with systematic automation

echo "🚀 Starting MCP Automated Testing System"
echo "Using verified working baseline: wpg9K9s8wlfofv1u"
echo "Smart Field Mapper v4.6: b8d9c432-2f9f-455e-a0f4-06863abfa10f"
echo ""

# Change to project directory
cd "$(dirname "$0")/.."

# Ensure we're in the right directory
if [ ! -f "tests/mcp-automated-testing-system.js" ]; then
    echo "❌ Error: Test system not found. Run from project root."
    exit 1
fi

# Run the comprehensive test suite
echo "Executing comprehensive test suite..."
node tests/mcp-automated-testing-system.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Automated testing complete!"
    echo "📊 Results saved in tests/results/"
    echo ""
    echo "Manual 30-minute process successfully automated 🎉"
else
    echo ""
    echo "❌ Testing encountered errors"
    echo "Check logs for details"
    exit 1
fi