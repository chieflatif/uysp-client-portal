#!/usr/bin/env node

/**
 * Fix Airtable Upsert Architecture
 * 
 * This script implements the correct two-node architecture that was working in Session 1:
 * 1. Route by Duplicate (IF node)
 * 2. Airtable Update (for duplicates, matches on ID)  
 * 3. Airtable Create (for new records)
 * 
 * Based on working backup: session-1-comprehensive-testing-complete.json
 */

const WORKFLOW_ID = 'Df0BIEOE7JsXf5Oq';

// Configuration for the two-node architecture
const architectureFix = {
  // 1. Route by Duplicate IF Node
  routeByDuplicate: {
    nodeId: 'route-by-duplicate-node',
    name: 'Route by Duplicate',
    type: 'n8n-nodes-base.if',
    parameters: {
      conditions: {
        options: {
          caseSensitive: true,
          leftValue: '',
          typeValidation: 'loose'
        },
        conditions: [
          {
            leftValue: '={{$json.duplicate}}',
            rightValue: 'true',
            operator: {
              type: 'boolean',
              operation: 'equals'
            }
          }
        ],
        combinator: 'and'
      }
    }
  },

  // 2. Airtable Update Node (Duplicate Path)
  airtableUpdate: {
    nodeId: 'airtable-update-duplicate',
    name: 'Airtable Update (Duplicate)',
    type: 'n8n-nodes-base.airtable',
    parameters: {
      operation: 'update',
      base: {
        __rl: true,
        value: 'appuBf0fTe8tp8ZaF',
        mode: ''
      },
      table: {
        __rl: true,
        value: 'tblSk2Ikg21932uE0',
        mode: ''
      },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          // Core fields updated on duplicates
          duplicate_count: '={{$json.duplicateCount}}',
          last_name: '={{$json.normalized.last_name}}',
          phone_recent: '={{$json.normalized.phone_recent}}',
          raw_webhook_data: '={{$json.normalized.raw_webhook_data}}',
          interested_in_coaching: '={{$json.normalized.interested_in_coaching !== undefined ? $json.normalized.interested_in_coaching : null}}',
          qualified_lead: '={{$json.normalized.qualified_lead !== undefined ? $json.normalized.qualified_lead : null}}',
          contacted: '={{$json.normalized.contacted !== undefined ? $json.normalized.contacted : null}}',
          
          // Tracking fields
          field_mapping_success_rate: '={{$json.normalized.field_mapping_success_rate}}',
          webhook_field_count: '={{$json.normalized.webhook_field_count}}',
          mapped_field_count: '={{$json.normalized.mapped_field_count}}',
          
          // Cost tracking (maintain zeros during field normalization phase)
          icp_score: 0,
          reengagement_count: 0,
          apollo_org_cost: 0,
          apollo_person_cost: 0,
          twilio_cost: 0,
          claude_cost: 0,
          total_processing_cost: 0,
          
          // Update timestamp
          created_date: '={{DateTime.now().toFormat(\'M/d/yyyy\')}}',
          
          // Critical: Use recordId from Duplicate Handler for matching
          id: '={{$json.recordId}}'
        },
        matchingColumns: ['id']
      }
    }
  },

  // 3. Airtable Create Node (New Record Path)
  airtableCreate: {
    nodeId: 'airtable-create-new',
    name: 'Airtable Create (New)',
    type: 'n8n-nodes-base.airtable',
    parameters: {
      operation: 'create',
      base: {
        __rl: true,
        value: 'appuBf0fTe8tp8ZaF',
        mode: ''
      },
      table: {
        __rl: true,
        value: 'tblSk2Ikg21932uE0',
        mode: ''
      },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          // Core contact fields
          email: '={{$json.normalized.email}}',
          first_name: '={{$json.normalized.first_name}}',
          last_name: '={{$json.normalized.last_name}}',
          company_input: '={{$json.normalized.company}}',
          title_current: '={{$json.normalized.title}}',
          linkedin_url: '={{$json.normalized.linkedin}}',
          
          // Lead tracking
          request_id: '={{$json.normalized.request_id || $json.request_id}}',
          lead_source: '={{$json.normalized.source_form}}',
          lead_status: 'New',
          
          // Phone strategy (3-field implementation)
          phone_original: '={{$json.normalized.phone_original}}',
          phone_recent: '={{$json.normalized.phone_recent}}',
          // phone_validated left null - only set by enrichment
          
          // Boolean fields with null fallback
          interested_in_coaching: '={{$json.normalized.interested_in_coaching ?? null}}',
          qualified_lead: '={{$json.normalized.qualified_lead ?? null}}',
          contacted: '={{$json.normalized.contacted ?? null}}',
          
          // International phone detection
          international_phone: '={{$json.normalized.international_phone}}',
          phone_country_code: '={{$json.normalized.phone_country_code}}',
          
          // Tracking and normalization
          field_mapping_success_rate: '={{$json.normalized.field_mapping_success_rate}}',
          webhook_field_count: '={{$json.normalized.webhook_field_count}}',
          mapped_field_count: '={{$json.normalized.mapped_field_count}}',
          normalization_version: '={{$json.normalized.normalization_version}}',
          raw_webhook_data: '={{$json.normalized.raw_webhook_data}}',
          unknown_field_list: '={{$json.normalized.unknown_field_list}}',
          
          // Initial values for new records
          duplicate_count: 0,
          icp_score: 0,
          reengagement_count: 0,
          apollo_org_cost: 0,
          apollo_person_cost: 0,
          twilio_cost: 0,
          claude_cost: 0,
          total_processing_cost: 0,
          
          // Creation timestamp
          created_date: '={{DateTime.now().toFormat(\'M/d/yyyy\')}}'
        },
        matchingColumns: []
      }
    }
  }
};

// MCP operations to implement the fix
const mcpOperations = [
  // Step 1: Update the current Airtable node to be the Update node for duplicates
  {
    type: 'updateNode',
    nodeId: 'airtable-upsert-dynamic', // Current problematic node
    changes: {
      name: 'Airtable Update (Duplicate)',
      'parameters.operation': 'update',
      'parameters.columns.value': architectureFix.airtableUpdate.parameters.columns.value,
      'parameters.columns.matchingColumns': ['id']
    }
  },

  // Step 2: Add the Route by Duplicate IF node
  {
    type: 'addNode',
    node: {
      id: 'route-by-duplicate-new',
      name: 'Route by Duplicate',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [0, 0], // Will be positioned correctly
      parameters: architectureFix.routeByDuplicate.parameters
    }
  },

  // Step 3: Add the Airtable Create node for new records
  {
    type: 'addNode',
    node: {
      id: 'airtable-create-new',
      name: 'Airtable Create (New)',
      type: 'n8n-nodes-base.airtable',
      typeVersion: 2.1,
      position: [200, 120], // Position below the update node
      parameters: architectureFix.airtableCreate.parameters,
      credentials: {
        airtableTokenApi: {
          id: 'WdyZ25N0TLnykzMq',
          name: 'Airtable Personal Access Token account 3'
        }
      }
    }
  }
];

console.log('🔧 AIRTABLE UPSERT ARCHITECTURE FIX');
console.log('=====================================');
console.log('');
console.log('📋 Required Changes:');
console.log('1. ✅ Route by Duplicate IF node');
console.log('2. ✅ Airtable Update (matches on ID for duplicates)');
console.log('3. ✅ Airtable Create (for new records)');
console.log('');
console.log('📁 Configuration exported to:');
console.log('   - architectureFix object contains all node configurations');
console.log('   - mcpOperations array contains MCP update operations');
console.log('');
console.log('🎯 Based on working Session 1 backup:');
console.log('   session-1-comprehensive-testing-complete.json');
console.log('');
console.log('📞 Next Steps:');
console.log('1. Use MCP tools to implement mcpOperations');
console.log('2. Update workflow connections');
console.log('3. Test with automated test suite');

// Export for use in MCP operations
module.exports = {
  architectureFix,
  mcpOperations,
  WORKFLOW_ID
}; 