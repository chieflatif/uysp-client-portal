#!/bin/bash

# UYSP Context Engineering Setup Script v2
# Enhanced with cleanup and source validation
# This script can be run in fresh context - it's self-contained

echo "=== UYSP Context Engineering Setup v2 ==="
echo "Enhanced setup with cleanup and validation"
echo ""

# Set paths
CURSOR_PROJECT="/Users/latifhorst/Documents/cursor projects/UYSP Lead Qualification V1"
SOURCE_DOCS="/Users/latifhorst/Documents/Ian Koniak/UYSP Lead Qualification Agent"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 0: Validate source documentation exists
echo "=== Step 0: Validating Source Documentation ==="
echo "Checking: $SOURCE_DOCS"

CRITICAL_FILES=(
    "00-field-normalization-mandatory.txt"
    "06-Reality-Based Testing Protocol.txt"
    "Phase 00_ System Setup & Verification Guide.md"
    "updated_development_sequence.md"
    "uysp-critical-patterns & enforcment.md"
    "reality_based_tests_v2.json"
    "updated_schemas_v2.json"
    "uysp_recovery_operations.md"
    "UYSP Session Preparation Guide for Claude AI PM.md"
    "uysp-implementation-guide.md"
)

MISSING_FILES=0
echo "Checking for critical files..."
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$SOURCE_DOCS/$file" ]; then
        echo -e "${GREEN}✓${NC} Found: $file"
    else
        echo -e "${RED}✗${NC} MISSING: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo -e "\n${RED}ERROR: $MISSING_FILES critical files missing!${NC}"
    echo "Please ensure all files are in: $SOURCE_DOCS"
    echo "Cannot proceed without these files."
    exit 1
fi

echo -e "\n${GREEN}All critical source files found!${NC}"

# Step 1: Backup important data before cleanup
echo ""
echo "=== Step 1: Backing Up Important Data ==="
BACKUP_DIR="$CURSOR_PROJECT/backups/pre-refactor-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup critical items
echo "Backing up critical files..."
cp -r "$CURSOR_PROJECT/memory_bank" "$BACKUP_DIR/" 2>/dev/null && echo "✓ memory_bank backed up"
cp -r "$CURSOR_PROJECT/workflows" "$BACKUP_DIR/" 2>/dev/null && echo "✓ workflows backed up"
cp -r "$CURSOR_PROJECT/patterns" "$BACKUP_DIR/" 2>/dev/null && echo "✓ existing patterns backed up"
cp "$CURSOR_PROJECT/.cursorrules" "$BACKUP_DIR/" 2>/dev/null && echo "✓ .cursorrules backed up"
cp -r "$CURSOR_PROJECT/tests" "$BACKUP_DIR/" 2>/dev/null && echo "✓ tests backed up"

echo -e "${GREEN}Backup complete at: $BACKUP_DIR${NC}"

# Step 2: Clean up old/unnecessary files and directories
echo ""
echo "=== Step 2: Cleaning Up Old Structure ==="

# Remove old pattern files (will be replaced with updated ones)
echo "Removing outdated directories..."
rm -rf "$CURSOR_PROJECT/@patterns" 2>/dev/null && echo "✓ Removed @patterns (duplicate)"
rm -rf "$CURSOR_PROJECT/@.cursor" 2>/dev/null && echo "✓ Removed @.cursor"
rm -rf "$CURSOR_PROJECT/configs" 2>/dev/null && echo "✓ Removed configs (using config instead)"
rm -rf "$CURSOR_PROJECT/reports" 2>/dev/null && echo "✓ Removed reports (unused)"
rm -rf "$CURSOR_PROJECT/recovery-strategy" 2>/dev/null && echo "✓ Removed recovery-strategy (outdated)"
rm -rf "$CURSOR_PROJECT/testsprite_tests" 2>/dev/null && echo "✓ Removed testsprite_tests (will use tests/)"

# Clean up root directory files
echo "Cleaning root directory..."
rm -f "$CURSOR_PROJECT/split_json_files.py" 2>/dev/null && echo "✓ Removed split_json_files.py"
rm -f "$CURSOR_PROJECT/.cursorrules" 2>/dev/null && echo "✓ Removed old .cursorrules (will create new structure)"

# Clean docs folder of outdated files
echo "Cleaning docs folder..."
find "$CURSOR_PROJECT/docs" -name "*.txt" -type f -delete 2>/dev/null && echo "✓ Removed old .txt docs"

# Step 3: Create new folder structure
echo ""
echo "=== Step 3: Creating Clean Folder Structure ==="

# Core directories
mkdir -p "$CURSOR_PROJECT/.cursorrules"
mkdir -p "$CURSOR_PROJECT/patterns"
mkdir -p "$CURSOR_PROJECT/workflows/backups"
mkdir -p "$CURSOR_PROJECT/config"
mkdir -p "$CURSOR_PROJECT/tests/payloads"
mkdir -p "$CURSOR_PROJECT/tests/results"
mkdir -p "$CURSOR_PROJECT/scripts"
mkdir -p "$CURSOR_PROJECT/memory_bank"
mkdir -p "$CURSOR_PROJECT/docs/reference"
mkdir -p "$CURSOR_PROJECT/schemas"

# Context engineering directories
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

echo "✓ Clean folder structure created"

# Step 4: Install patterns with proper naming
echo ""
echo "=== Step 4: Installing Pattern Library ==="

# Copy and rename patterns for consistency
cp "$SOURCE_DOCS/00-field-normalization-mandatory.txt" "$CURSOR_PROJECT/patterns/00-field-normalization-mandatory.txt"
echo "✓ Pattern 00: Field Normalization (CRITICAL!)"

# Keep existing patterns 01-05 if they exist and are valid
for i in {1..5}; do
    if [ -f "$BACKUP_DIR/patterns/0${i}-*.txt" ]; then
        cp "$BACKUP_DIR/patterns/0${i}-"*.txt "$CURSOR_PROJECT/patterns/"
        echo "✓ Pattern 0${i}: Restored from backup"
    fi
done

# Add Pattern 06
cp "$SOURCE_DOCS/06-Reality-Based Testing Protocol.txt" "$CURSOR_PROJECT/patterns/06-reality-based-testing-protocol.txt"
echo "✓ Pattern 06: Reality-Based Testing"

# Step 5: Create enforcement rules in .cursorrules/
echo ""
echo "=== Step 5: Installing Enforcement Rules ==="

# Create main rules file
cat > "$CURSOR_PROJECT/.cursorrules/00-CRITICAL-ALWAYS.md" << 'EOF'
# CRITICAL RULES - ALWAYS ACTIVE

## BEFORE EVERY RESPONSE:
1. Check memory_bank/active_context.md for current state
2. Check patterns/00-field-normalization-mandatory.txt exists
3. Verify MCP tools with: n8n-mcp list_workflows

## 1. FIELD NORMALIZATION IS MANDATORY
- EVERY webhook MUST have Smart Field Mapper as FIRST node after webhook
- Reference: patterns/00-field-normalization-mandatory.txt
- Without this = 100% FAILURE RATE
- Test with 10+ payload variations minimum

## 2. EVIDENCE-BASED DEVELOPMENT ONLY
Every success claim MUST include:
```
EVIDENCE:
- Workflow ID: [from n8n-mcp]
- Execution ID: [from test run]
- Airtable Record: recXXXXXXXXXXXXXX
- Fields Captured: X/Y (XX%)
```

## 3. MCP TOOLS VERIFICATION
When claiming "no access", show:
```xml
<tool_audit>
<command>n8n-mcp list_workflows</command>
<error>[exact error]</error>
<retry_count>3</retry_count>
</tool_audit>
```

## 4. PLATFORM GOTCHAS (UI MANUAL FIXES)
- "Always Output Data" → Settings tab (NOT Parameters)
- Expression spaces: {{ $json.field }} ✓
- Table IDs only: tblXXXXXXXXXXXXXX ✓
- Credentials: UI selection only
- Webhook test: Manual activation each time

## 5. WHOLE SYSTEM TESTING
After ANY change:
1. Send test webhook payload
2. Check field normalization output
3. Verify Airtable record created
4. Confirm no workflow errors
5. Export working JSON

## 6. MEMORY BANK UPDATES
After EVERY component:
- Update memory_bank/active_context.md
- Log evidence in memory_bank/evidence_log.md
- Track progress in memory_bank/progress.md
EOF

# Create evidence templates
cat > "$CURSOR_PROJECT/.cursorrules/01-evidence-templates.md" << 'EOF'
# Evidence Collection Templates

## Component Complete
```
COMPONENT: [Name]
STATUS: Complete
EVIDENCE:
- Workflow ID: ___
- Export Path: workflows/backups/[timestamp]-[component].json
- Test Payload: tests/payloads/[test-name].json
- Test Result: tests/results/[timestamp]-result.json
- Airtable Records: [rec1, rec2, rec3]
- Field Success Rate: ___%
```

## Test Execution
```
TEST: [Description]
PAYLOAD: [Reference]
EVIDENCE:
- Execution ID: ___
- Duration: ___ms
- Webhook Response: 200
- Fields Normalized: __/__
- Airtable Created: recXXXXXXXXXXXXXX
- Screenshot: tests/results/[timestamp].png
```

## Error Resolution
```
ERROR: [Type]
SYMPTOM: [What happened]
DIAGNOSIS: [Root cause]
FIX: [What changed]
EVIDENCE:
- Before: [State/Error]
- After: [Working state]
- Verification: [How tested]
```
EOF

# Create enforcement responses
cat > "$CURSOR_PROJECT/.cursorrules/02-enforcement-responses.md" << 'EOF'
# Enforcement Response Library

## Tool Access Denial
```
VIOLATION DETECTED. The tools are verified working.

Required proof:
<tool_audit>
<timestamp>$(date -u +%Y-%m-%dT%H:%M:%SZ)</timestamp>
<command>[exact MCP command]</command>
<error>[complete error message]</error>
<retry_attempts>
  <attempt n="1"><time>[timestamp]</time><result>[output]</result></attempt>
  <attempt n="2"><time>[timestamp]</time><result>[output]</result></attempt>
  <attempt n="3"><time>[timestamp]</time><result>[output]</result></attempt>
</retry_attempts>
</tool_audit>

No audit = lying. Try the tools again.
```

## Success Without Evidence
```
INCOMPLETE. "It works" means nothing.

Required evidence:
1. n8n-mcp get_workflow --id [xxx]
2. n8n-mcp get_execution --id [xxx]
3. airtable-mcp get_record --table People --id recXXX
4. Screenshot showing the result

Provide ALL evidence or retract claim.
```

## Isolated Component Fix
```
SYSTEM-WIDE IMPACT CHECK REQUIRED.

You changed: [component]
Now verify ALL of these still work:
- [ ] Webhook receives data
- [ ] Field mapper normalizes (95%+)
- [ ] Duplicate detection works
- [ ] Airtable create/update works
- [ ] Cost tracking updates
- [ ] No workflow errors

Show execution ID for complete test.
```

## Field Normalization Skip
```
CRITICAL VIOLATION: No field normalization detected!

This is 100% GUARANTEED FAILURE.
1. Add Smart Field Mapper node immediately after webhook
2. Copy EXACT code from patterns/00-field-normalization-mandatory.txt
3. Test with ALL 10 payload variations
4. Show field capture rate for each test

No exceptions. No shortcuts.
```
EOF

# Step 6: Copy critical documentation
echo ""
echo "=== Step 6: Installing Documentation ==="

# Copy to organized locations
cp "$SOURCE_DOCS/Phase 00_ System Setup & Verification Guide.md" "$CURSOR_PROJECT/context/phase-00/setup-guide.md" 2>/dev/null
cp "$SOURCE_DOCS/updated_development_sequence.md" "$CURSOR_PROJECT/docs/reference/" 2>/dev/null
cp "$SOURCE_DOCS/uysp-critical-patterns & enforcment.md" "$CURSOR_PROJECT/docs/reference/" 2>/dev/null
cp "$SOURCE_DOCS/uysp-implementation-guide.md" "$CURSOR_PROJECT/docs/reference/" 2>/dev/null
cp "$SOURCE_DOCS/reality_based_tests_v2.json" "$CURSOR_PROJECT/tests/reality-based-tests-v2.json" 2>/dev/null
cp "$SOURCE_DOCS/updated_schemas_v2.json" "$CURSOR_PROJECT/schemas/airtable-schemas-v2.json" 2>/dev/null
cp "$SOURCE_DOCS/UYSP Session Preparation Guide for Claude AI PM.md" "$CURSOR_PROJECT/docs/reference/session-prep-guide.md" 2>/dev/null

echo "✓ Documentation installed in organized structure"

# Step 7: Create verification tools
echo ""
echo "=== Step 7: Creating Verification Tools ==="

# Pre-session checklist
cat > "$CURSOR_PROJECT/verification/pre-session-checklist.md" << 'EOF'
# Pre-Session Verification Checklist

## Environment Check
- [ ] TEST_MODE=true in n8n variables
- [ ] Airtable base ID: appuBf0fTe8tp8ZaF
- [ ] n8n workspace: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/

## Tools Verification
```bash
# Run these commands:
n8n-mcp list_workflows
airtable-mcp list_tables --base-id appuBf0fTe8tp8ZaF
```

## Pattern Check
- [ ] patterns/00-field-normalization-mandatory.txt EXISTS
- [ ] Current session pattern loaded
- [ ] Test payloads ready in tests/payloads/

## Memory Bank Status
- [ ] memory_bank/active_context.md current
- [ ] memory_bank/progress.md updated
- [ ] memory_bank/evidence_log.md ready

## Platform Gotchas Reminder
- [ ] Human ready to enable "Always Output Data" in UI
- [ ] Human ready to select credentials in UI
- [ ] Human understands webhook test mode
EOF

# Create quick test script
cat > "$CURSOR_PROJECT/scripts/quick-test.sh" << 'EOF'
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
EOF

chmod +x "$CURSOR_PROJECT/scripts/quick-test.sh"

# Step 8: Create README for the clean structure
echo ""
echo "=== Step 8: Creating Project README ==="

cat > "$CURSOR_PROJECT/README.md" << 'EOF'
# UYSP Lead Qualification V1 - Refactored

## Project Structure

```
.
├── .cursorrules/          # Cursor AI enforcement rules
│   ├── 00-CRITICAL-ALWAYS.md
│   ├── 01-evidence-templates.md
│   └── 02-enforcement-responses.md
├── patterns/              # Implementation patterns (00-06)
│   ├── 00-field-normalization-mandatory.txt ⚠️ CRITICAL
│   ├── 01-core-patterns.txt
│   └── ...
├── context/               # Session-specific documentation
│   ├── phase-00/
│   └── session-0/ through session-7/
├── workflows/             # n8n workflow exports
│   └── backups/          # Versioned backups
├── memory_bank/          # AI agent state tracking
├── tests/                # Test payloads and results
├── schemas/              # Airtable schemas
└── scripts/              # Utility scripts
```

## Critical Requirements

1. **Field Normalization is MANDATORY** - Pattern 00 must be first node after webhook
2. **Evidence-based development** - All claims need IDs and proof
3. **Platform gotchas** - Some settings are UI-only
4. **Test with real data** - Check Airtable records, not HTTP 200s

## Quick Start

1. Run verification: `./scripts/quick-test.sh`
2. Check Pattern 00 exists
3. Start with Phase 00 setup
EOF

# Final summary
echo ""
echo "=== Setup Complete ==="
echo ""
echo -e "${GREEN}✅ Source files validated${NC}"
echo -e "${GREEN}✅ Old structure cleaned up${NC}"
echo -e "${GREEN}✅ Clean folder structure created${NC}"
echo -e "${GREEN}✅ Enforcement rules installed${NC}"
echo -e "${GREEN}✅ Patterns library ready${NC}"
echo -e "${GREEN}✅ Verification tools in place${NC}"
echo ""
echo -e "${YELLOW}CRITICAL REMINDERS:${NC}"
echo "1. Pattern 00 (field normalization) - WITHOUT THIS = 100% FAILURE"
echo "2. Test with actual Airtable records, not just HTTP responses"
echo "3. Platform gotchas need manual UI fixes"
echo "4. Evidence required for EVERY claim of success"
echo ""
echo "Backup of old structure saved to:"
echo "$BACKUP_DIR"
echo ""
echo "Next step: Start Phase 00 setup using context/phase-00/setup-guide.md"
