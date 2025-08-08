#!/usr/bin/env node

/**
 * Enhanced Airtable Schema Export
 * Captures complete table structures, field definitions, and relationships
 * Part of Chunk 2: Enhanced Airtable Schema Export
 */

const fs = require('fs');
const path = require('path');

const AIRTABLE_BASE_ID = "appuBf0fTe8tp8ZaF";
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const SCHEMAS_DIR = "./data/schemas";

// Ensure schemas directory exists
if (!fs.existsSync(SCHEMAS_DIR)) {
    fs.mkdirSync(SCHEMAS_DIR, { recursive: true });
}

console.log("🔄 Enhanced Airtable Schema Export Starting...");
console.log(`📅 Timestamp: ${TIMESTAMP}`);

// Mock complete schema export (in real implementation, this would use MCP Airtable tools)
const completeSchema = {
    "baseId": AIRTABLE_BASE_ID,
    "exportMetadata": {
        "exportedAt": new Date().toISOString(),
        "exportedBy": "enhanced-airtable-export.js",
        "version": "2.0",
        "exportType": "complete_schema_backup"
    },
    "tables": {
        "People": {
            "id": "tblSk2Ikg21932uE0",
            "name": "People",
            "description": "Main contact storage with normalized fields - Session 0 & 1 complete",
            "totalFields": 60,
            "keyFields": {
                "email": "fldY5wcpct2BQy26k",
                "phone_primary": "fldXxhI9PdGQH3w9q",
                "phone_original": "fld1ME4syQIbYSmuF",
                "phone_recent": "fldbcwWvQ5QQk5TWD", 
                "phone_validated": "fld0tRS5mpe81t3RA",
                "first_name": "flda2t5DDhL2ORBFd",
                "last_name": "fldLm8S2r7avlrcJU",
                "company_input": "fldXTRlB9WxePpI3t",
                "icp_score": "fldV855gixrnXM1MD",
                "processing_status": "fld2iK05BoWTkZ57h"
            },
            "criticalFlags": {
                "ready_for_sms": "fldMdVenBNFDg0nkn",
                "test_mode_record": "fldEk70hM6eEMtRGs",
                "international_phone": "fldX6ZbS1PmEtQSUk",
                "qualified_lead": "fldXS3c295saKvtf0"
            },
            "relationships": {
                "Communications": "fldBT7KA9rYG2AXKt"
            }
        },
        "DND_List": {
            "id": "tblPV3aierIkDhaAU",
            "name": "DND_List",
            "description": "Do Not Disturb registry - Session 2 compliance checking",
            "totalFields": 7,
            "keyFields": {
                "phone": "flduAiX2sbMB1ij8D",
                "email": "fld0Vk393SRIlvXfc",
                "opt_out_date": "fldBQQtg4enEGWaEq",
                "permanent": "fldEj4QXfMGDwHuYs"
            }
        },
        "Communications": {
            "id": "tblBlfDVD79EdKi0O", 
            "name": "Communications",
            "description": "SMS and communication audit trail - Session 2+ compliance logging",
            "totalFields": 17,
            "keyFields": {
                "person_id": "fldSbmZHkRIczUyCz",
                "message_type": "fldIHAP3AIl2RJaJ9",
                "sent_time": "fldjHRD2qrgNGysd0",
                "dnd_checked": "fldPaAvF3U6X01LpJ",
                "time_window_checked": "fldZDC7GZCCCscmIk"
            },
            "relationships": {
                "People": "fldSbmZHkRIczUyCz"
            }
        },
        "Error_Log": {
            "id": "tblhwXfPLCoF1hvNi",
            "name": "Error_Log", 
            "description": "Error tracking and debugging - Session 1+ comprehensive logging",
            "totalFields": 10,
            "keyFields": {
                "workflow_name": "fld1Vkb0mcBVC4nxx",
                "execution_id": "fld9TbcIe8nnqohoU",
                "error_type": "fldBd480e6ajjGC5n",
                "timestamp": "fld9bSTIzvPjBIdjV"
            }
        },
        "Daily_Costs": {
            "id": "tblgPXWEc6SkexI2i",
            "name": "Daily_Costs",
            "description": "Cost tracking and budget monitoring",
            "totalFields": 12,
            "keyFields": {
                "date": "fld3Pr3hFg1K0dcL3",
                "total_costs": "fldxULNskVSsHVGLy",
                "circuit_breaker_triggered": "flddv5Ygma72Xl7c3"
            }
        },
        "Enrichment_Cache": {
            "id": "tbllaedZ9xlbvrnw0",
            "name": "Enrichment_Cache",
            "description": "Apollo API response caching for cost optimization",
            "totalFields": 9
        },
        "Daily_Metrics": {
            "id": "tblamPHaPOuAQJSuc", 
            "name": "Daily_Metrics",
            "description": "Performance metrics and KPI tracking",
            "totalFields": 16
        },
        "Field_Mapping_Log": {
            "id": "tbl9cOmvkdcokyFmG",
            "name": "Field_Mapping_Log", 
            "description": "Unknown webhook field tracking for mapping updates",
            "totalFields": 6
        },
        "Human_Review_Queue": {
            "id": "tbljmIuoX3Qi28WIq",
            "name": "Human_Review_Queue",
            "description": "Manual review queue for edge cases",
            "totalFields": 9
        },
        "Workflow_IDs": {
            "id": "tblt2rHlFUxMHaaJ9",
            "name": "Workflow_IDs", 
            "description": "n8n workflow ID tracking and versioning",
            "totalFields": 4
        }
    },
    "workflowIntegration": {
        "primaryWorkflow": "CefJB1Op3OySG8nb",
        "webhookEndpoints": {
            "kajabi_leads": "/webhook/kajabi-leads",
            "sms_responses": "/webhook/sms-responses"
        },
        "criticalDependencies": [
            "People table must exist for all lead processing",
            "DND_List required for compliance checking", 
            "Communications required for audit trail",
            "Error_Log required for debugging and monitoring"
        ]
    },
    "backupInstructions": {
        "fullSchemaCommand": "Use MCP: mcp_airtable_list_tables with detailLevel=full",
        "dataExportCommand": "Use MCP: mcp_airtable_list_records for each table",
        "criticalTables": ["People", "DND_List", "Communications", "Error_Log"],
        "recoveryPriority": [
            "1. People table (primary data)",
            "2. DND_List (compliance)",
            "3. Communications (audit trail)", 
            "4. Error_Log (debugging)",
            "5. All other tables"
        ]
    },
    "versionControl": {
        "schemaVersion": "3.1",
        "lastSchemaChange": "2025-07-31",
        "changes": [
            "Phase 2: Added phone versioning (original/recent/validated)",
            "Session 2: Enhanced DND compliance fields",
            "Session 2: Added time window checking to Communications"
        ]
    }
};

// Save enhanced schema
const schemaFile = path.join(SCHEMAS_DIR, `airtable-enhanced-schema-${TIMESTAMP}.json`);
fs.writeFileSync(schemaFile, JSON.stringify(completeSchema, null, 2));

console.log("✅ Enhanced Airtable Schema exported successfully");
console.log(`📊 File: ${schemaFile}`);
console.log(`📊 Size: ${Math.round(Buffer.byteLength(JSON.stringify(completeSchema)) / 1024)}KB`);
console.log(`📊 Tables: ${Object.keys(completeSchema.tables).length}`);
console.log(`📊 Schema version: ${completeSchema.versionControl.schemaVersion}`);

// Create recovery instructions
const recoveryFile = path.join(SCHEMAS_DIR, `recovery-instructions-${TIMESTAMP}.md`);
const recoveryInstructions = `# Airtable Recovery Instructions
Generated: ${new Date().toISOString()}

## Critical Recovery Order
${completeSchema.backupInstructions.recoveryPriority.map(step => `${step}`).join('\n')}

## Table Recreation Commands
\`\`\`bash
# Use these MCP commands to recreate tables:
${Object.entries(completeSchema.tables).map(([name, table]) => 
`# ${name}: ${table.description}
mcp_airtable_create_table baseId="${AIRTABLE_BASE_ID}" name="${name}"`
).join('\n')}
\`\`\`

## Field Mapping References
${Object.entries(completeSchema.tables).map(([name, table]) => 
`### ${name}
${table.keyFields ? Object.entries(table.keyFields).map(([field, id]) => `- ${field}: ${id}`).join('\n') : '- No key fields defined'}`
).join('\n\n')}

## Workflow Dependencies
- Primary Workflow: ${completeSchema.workflowIntegration.primaryWorkflow}
- Webhook Endpoints: ${JSON.stringify(completeSchema.workflowIntegration.webhookEndpoints, null, 2)}
`;

fs.writeFileSync(recoveryFile, recoveryInstructions);

console.log(`✅ Recovery instructions: ${recoveryFile}`);
console.log("");
console.log("🎯 Next Steps:");
console.log("1. Commit these enhanced schemas to Git");
console.log("2. Push to GitHub for cloud backup");
console.log("3. Test schema export with real MCP tools");
console.log("4. Set up automated daily schema snapshots");