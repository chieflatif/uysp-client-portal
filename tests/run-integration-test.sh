#!/bin/bash

# UYSP Lead Qualification Workflow Integration Test Runner
# Runs the core workflow integration tester with proper setup

echo "🚀 UYSP Lead Qualification Workflow Integration Tester"
echo "===================================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js to run tests."
    exit 1
fi

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Create results directory if it doesn't exist
mkdir -p tests/results

# Run the integration test
echo "📊 Starting 5 comprehensive test scenarios..."
echo "🎯 Target: https://rebelhq.app.n8n.cloud/webhook/kajabi-leads"
echo "📋 Database: appuBf0fTe8tp8ZaF/tblSk2Ikg21932uE0"
echo "🔧 Uses REAL MCP tools for verification"
echo ""

# Execute the test script
node tests/core-workflow-integration-tester.js

# Capture exit code
exit_code=$?

echo ""
echo "📄 Test results available in: tests/results/"
echo "🔍 Check the latest JSON file for detailed evidence"

# Exit with the same code as the test
exit $exit_code