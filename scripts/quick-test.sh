#!/bin/bash
# Quick MCP tools test

echo "Testing MCP tools availability..."
echo ""
echo "1. Testing n8n-mcp:"
n8n-mcp list_workflows

echo ""
echo "2. Testing airtable-mcp:"
airtable-mcp list_tables --base-id appuBf0fTe8tp8ZaF

echo ""
echo "3. Checking critical pattern:"
if [ -f "patterns/00-field-normalization-mandatory.txt" ]; then
    echo "✓ Pattern 00 found"
else
    echo "✗ CRITICAL: Pattern 00 missing!"
fi
