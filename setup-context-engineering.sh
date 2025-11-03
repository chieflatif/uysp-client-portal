#!/bin/bash

# UYSP Context Engineering Setup Script
# This script prepares the Cursor environment with all lessons learned

echo "=== UYSP Context Engineering Setup ==="
echo "Setting up enhanced Cursor environment with enforcement rules..."

# Set paths
CURSOR_PROJECT="/Users/latifhorst/Documents/cursor projects/UYSP Lead Qualification V1"
SOURCE_DOCS="/Users/latifhorst/Documents/Ian Koniak/UYSP Lead Qualification Agent"

# Step 1: Create the new folder structure
echo ""
echo "Step 1: Creating context engineering folders..."
mkdir -p "$CURSOR_PROJECT/.cursorrules"
mkdir -p "$CURSOR_PROJECT/context/phase-00"
mkdir -p "$CURSOR_PROJECT/context/session-0"
mkdir -p "$CURSOR_PROJECT/context/session-1"
mkdir -p "$CURSOR_PROJECT/context/session-2"
mkdir -p "$CURSOR_PROJECT/context/session-3"
mkdir -p "$CURSOR_PROJECT/context/session-4"
mkdir -p "$CURSOR_PROJECT/context/session-5"
mkdir -p "$CURSOR_PROJECT/context/session-6"
mkdir -p "$CURSOR_PROJECT/context/session-7"
mkdir -p "$CURSOR_PROJECT/context/platform-gotchas"
mkdir -p "$CURSOR_PROJECT/prompts"
mkdir -p "$CURSOR_PROJECT/verification"

# Step 2: Backup existing .cursorrules file
echo ""
echo "Step 2: Backing up existing .cursorrules..."
if [ -f "$CURSOR_PROJECT/.cursorrules" ]; then
    mv "$CURSOR_PROJECT/.cursorrules" "$CURSOR_PROJECT/.cursorrules.backup-$(date +%Y%m%d-%H%M%S)"
    echo "Existing .cursorrules backed up"
fi

# Step 3: Copy critical patterns to patterns folder
echo ""
echo "Step 3: Installing critical patterns..."
# Pattern 00 - Field Normalization (MANDATORY)
if [ -f "$SOURCE_DOCS/00-field-normalization-mandatory.txt" ]; then
    cp "$SOURCE_DOCS/00-field-normalization-mandatory.txt" "$CURSOR_PROJECT/patterns/"
    echo "✅ Pattern 00 (Field Normalization) installed - CRITICAL!"
else
    echo "❌ WARNING: Pattern 00 not found in source - THIS IS CRITICAL!"
fi

# Pattern 06 - Reality-Based Testing
if [ -f "$SOURCE_DOCS/06-Reality-Based Testing Protocol.txt" ]; then
    cp "$SOURCE_DOCS/06-Reality-Based Testing Protocol.txt" "$CURSOR_PROJECT/patterns/06-reality-based-testing.txt"
    echo "✅ Pattern 06 (Reality Testing) installed"
fi

# Step 4: Create enforcement rules in .cursorrules/
echo ""
echo "Step 4: Creating enforcement rules..."
# We'll create these from the consolidated documentation
cat > "$CURSOR_PROJECT/.cursorrules/00-CRITICAL-ALWAYS.md" << 'EOF'
# CRITICAL RULES - ALWAYS ACTIVE

## 1. FIELD NORMALIZATION IS MANDATORY
- EVERY webhook MUST have Smart Field Mapper as FIRST node after webhook
- Check patterns/00-field-normalization-mandatory.txt
- Without this = 100% FAILURE RATE

## 2. EVIDENCE-BASED DEVELOPMENT ONLY
Every claim of success MUST include:
- Workflow ID from n8n-mcp
- Execution ID from test run
- Airtable record ID created
- Field mapping success rate

Format evidence as:
```
EVIDENCE:
- Workflow ID: xxx
- Execution ID: xxx
- Airtable Record: recXXXXXXXXXXXXXX
- Fields Captured: X/Y (XX%)
```

## 3. MCP TOOLS ARE ALWAYS AVAILABLE
If you claim "no access to tools", provide:
<tool_audit>
<command>exact command attempted</command>
<error>exact error received</error>
<retry_count>3</retry_count>
</tool_audit>

## 4. TEST THE ENTIRE SYSTEM
After ANY change:
1. Send test payload to webhook
2. Verify field normalization worked
3. Check Airtable record created
4. Confirm no workflow errors

## 5. PLATFORM GOTCHAS TO CHECK
- "Always Output Data" enabled on IF/Switch nodes (UI only)
- Expressions have spaces: {{ $json.field }} ✓
- Table references use IDs: tblXXXXXX ✓
- Webhook test mode requires manual activation per test
EOF

cat > "$CURSOR_PROJECT/.cursorrules/01-evidence-templates.md" << 'EOF'
# Evidence Collection Templates

## After Creating Workflow
```
COMPONENT: [Name]
STATUS: Complete
EVIDENCE:
- Workflow ID: ___
- Node Count: ___
- Webhook Path: /webhook/___
- Field Mapper: YES/NO
- Exported: workflows/backups/___
```

## After Testing
```
TEST: [Payload Name]
RESULT: Success/Failure
EVIDENCE:
- Execution ID: ___
- Webhook Response: 200/XXX
- Fields Normalized: ___/___
- Airtable Record: recXXXXXXXXXXXXXX
- Processing Time: ___ms
```

## After Fixing Error
```
ERROR: [Description]
FIX: [What was changed]
EVIDENCE:
- Before State: ___
- After State: ___
- Test Execution: ___
- Verification: [How confirmed working]
```
EOF

cat > "$CURSOR_PROJECT/.cursorrules/02-enforcement-responses.md" << 'EOF'
# Pre-Written Enforcement Responses

## When claiming "no tool access"
```
VIOLATION. Show tool audit:
<tool_audit>
<command>n8n-mcp list_workflows</command>
<error>[your claimed error]</error>
<timestamp>[when tried]</timestamp>
</tool_audit>
Tools verified working. Try again.
```

## When claiming success without evidence
```
INCOMPLETE. Provide evidence:
- Workflow ID: ___
- Test execution ID: ___
- Airtable record created: ___
- Screenshot if needed: ___
No evidence = didn't happen.
```

## When fixing in isolation
```
STOP. Test ENTIRE workflow:
1. Webhook receives? [ID]
2. Fields normalized? [%]
3. Airtable record? [ID]
4. No errors? [Execution ID]
Partial fixes break systems.
```
EOF

# Step 5: Copy key documentation files
echo ""
echo "Step 5: Installing key documentation..."
# Copy critical docs to easy-access location
cp "$SOURCE_DOCS/Phase 00_ System Setup & Verification Guide.md" "$CURSOR_PROJECT/context/phase-00/" 2>/dev/null
cp "$SOURCE_DOCS/updated_development_sequence.md" "$CURSOR_PROJECT/docs/" 2>/dev/null
cp "$SOURCE_DOCS/uysp-critical-patterns & enforcment.md" "$CURSOR_PROJECT/docs/" 2>/dev/null
cp "$SOURCE_DOCS/reality_based_tests_v2.json" "$CURSOR_PROJECT/tests/" 2>/dev/null

# Step 6: Create session prompt templates
echo ""
echo "Step 6: Creating prompt templates..."
cat > "$CURSOR_PROJECT/prompts/session-0-field-normalization.md" << 'EOF'
# Session 0: Field Normalization

MANDATORY FIRST SESSION - WITHOUT THIS, 100% FAILURE RATE

## Your Task
Implement Smart Field Mapper from patterns/00-field-normalization-mandatory.txt

## Requirements
1. Create test workflow first
2. Test with ALL 10 payload variations
3. Achieve 95%+ field capture rate
4. Export working component

## Evidence Required
- Test results for all 10 payloads
- Field capture percentages
- Unknown fields logged
- Exported JSON location
EOF

# Step 7: Create verification checklist
echo ""
echo "Step 7: Creating verification tools..."
cat > "$CURSOR_PROJECT/verification/pre-session-checklist.md" << 'EOF'
# Pre-Session Verification Checklist

Before ANY development session:

## Tools Check
- [ ] n8n-mcp list_workflows works
- [ ] airtable-mcp list_tables works
- [ ] Current memory_bank state checked

## Pattern Check
- [ ] Pattern 00 in patterns/ folder
- [ ] Session pattern loaded
- [ ] Evidence templates ready

## Environment Check
- [ ] TEST_MODE=true
- [ ] Airtable base ID verified
- [ ] n8n webhook URL confirmed
EOF

echo ""
echo "=== Setup Complete ==="
echo ""
echo "✅ Context engineering folders created"
echo "✅ Enforcement rules installed"
echo "✅ Critical patterns ready"
echo "✅ Verification tools in place"
echo ""
echo "CRITICAL REMINDERS:"
echo "1. Pattern 00 (field normalization) is MANDATORY"
echo "2. Test with actual Airtable record creation, not HTTP 200s"
echo "3. Evidence required for ALL claims"
echo "4. Platform gotchas need manual UI fixes"
echo ""
echo "Next steps:"
echo "1. Review files in .cursorrules/ folder"
echo "2. Ensure Pattern 00 copied successfully"
echo "3. Ready to start Phase 00 setup"
