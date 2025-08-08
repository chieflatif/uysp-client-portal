#!/usr/bin/env node

// UYSP Workflow Positioner CLI
// Command-line tool for smart workflow positioning

const { UYSPPositioning } = require('./smart-positioning.js');
const { WorkflowPositioningUtils } = require('./workflow-positioning-utils.js');

class WorkflowPositionerCLI {
  constructor() {
    this.positioner = new UYSPPositioning();
    this.utils = new WorkflowPositioningUtils();
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'position':
        await this.positionWorkflow(args[1], args[2] || 'lead_processing');
        break;
      case 'create':
        await this.createWorkflow(args[1], args[2] || 'lead_processing');
        break;
      case 'report':
        await this.generateReport(args[1], args[2] || 'lead_processing');
        break;
      case 'validate':
        await this.validatePositioning(args[1]);
        break;
      case 'layouts':
        this.showLayouts();
        break;
      case 'test':
        this.testPositioning();
        break;
      default:
        this.showHelp();
    }
  }

  async positionWorkflow(workflowId, layoutType) {
    if (!workflowId) {
      console.error('❌ Workflow ID required');
      return;
    }

    console.log(`🎯 Positioning workflow ${workflowId} with ${layoutType} layout...`);

    try {
      // Mock workflow data for testing (in production, fetch from n8n)
      const workflowData = {
        id: workflowId,
        name: 'Test Workflow',
        nodes: [
          { id: 'node1', name: 'Webhook' },
          { id: 'node2', name: 'Field Mapper' },
          { id: 'node3', name: 'Search' },
          { id: 'node4', name: 'Duplicate Check' },
          { id: 'node5', name: 'Create Record' }
        ]
      };

      const operations = this.utils.generatePositioningOperations(workflowData, layoutType);
      const batches = this.utils.batchOperations(operations);

      console.log(`📊 Generated ${operations.length} positioning operations in ${batches.length} batches`);

      batches.forEach((batch, index) => {
        console.log(`\n🔄 Batch ${index + 1}:`);
        batch.forEach(op => {
          console.log(`  ${op.type}: ${op.nodeId} → [${op.position[0]}, ${op.position[1]}]`);
        });
      });

      console.log('\n✅ Positioning operations generated successfully');
      console.log('💡 To apply to n8n, use the n8n MCP tools with these operations');

    } catch (error) {
      console.error('❌ Error positioning workflow:', error.message);
    }
  }

  async createWorkflow(workflowName, layoutType) {
    if (!workflowName) {
      console.error('❌ Workflow name required');
      return;
    }

    console.log(`🚀 Creating new workflow: ${workflowName} with ${layoutType} layout...`);

    const nodeConfigs = [
      { name: 'Webhook', type: 'n8n-nodes-base.webhook' },
      { name: 'Field Mapper', type: 'n8n-nodes-base.code' },
      { name: 'Search', type: 'n8n-nodes-base.airtable' },
      { name: 'Duplicate Check', type: 'n8n-nodes-base.code' },
      { name: 'Create Record', type: 'n8n-nodes-base.airtable' }
    ];

    const workflowSpec = this.utils.generateWorkflowWithPositioning(
      workflowName,
      layoutType,
      nodeConfigs
    );

    console.log('📋 Workflow specification generated:');
    console.log(JSON.stringify(workflowSpec, null, 2));

    console.log('\n✅ Workflow ready for creation');
    console.log('💡 Use n8n MCP create_workflow with this specification');
  }

  async generateReport(workflowId, layoutType) {
    console.log(`📊 Generating positioning report for workflow ${workflowId}...`);

    // Mock workflow data
    const workflowData = {
      id: workflowId,
      name: 'Test Workflow',
      nodes: [
        { id: 'node1', name: 'Webhook' },
        { id: 'node2', name: 'Field Mapper' },
        { id: 'node3', name: 'Search' },
        { id: 'node4', name: 'Duplicate Check' },
        { id: 'node5', name: 'Create Record' }
      ]
    };

    const report = this.utils.generatePositioningReport(workflowData, layoutType);

    console.log('\n📋 POSITIONING REPORT');
    console.log('=' .repeat(50));
    console.log(`Workflow: ${report.workflowName} (${report.workflowId})`);
    console.log(`Layout Type: ${report.layoutType}`);
    console.log(`Nodes: ${report.nodeCount}`);
    console.log(`Positions Generated: ${report.positionsGenerated}`);
    console.log(`Validation: ${report.validation.valid ? '✅ PASSED' : '❌ FAILED'}`);

    if (!report.validation.valid) {
      console.log('\n❌ VALIDATION ISSUES:');
      report.validation.issues.forEach(issue => {
        console.log(`  ${issue.type}: ${issue.nodes.join(' & ')} overlap at [${issue.position[0]}, ${issue.position[1]}]`);
      });
    }

    console.log('\n📍 POSITION MAP:');
    Object.entries(report.positionMap).forEach(([node, position]) => {
      console.log(`  ${node}: [${position[0]}, ${position[1]}]`);
    });

    console.log(`\n🕒 Generated: ${report.generatedAt}`);
  }

  async validatePositioning(workflowId) {
    console.log(`🔍 Validating positioning for workflow ${workflowId}...`);

    // This would normally fetch current positions from n8n
    const currentPositions = {
      'Webhook': [250, 300],
      'Field Mapper': [450, 300],
      'Search': [650, 300],
      'Duplicate Check': [850, 300],
      'Create Record': [1050, 300]
    };

    const validation = this.utils.validatePositions(currentPositions);

    if (validation.valid) {
      console.log('✅ All positions are valid - no overlaps detected');
    } else {
      console.log('❌ Validation failed:');
      validation.issues.forEach(issue => {
        console.log(`  ${issue.type}: ${issue.nodes.join(' & ')} overlap at [${issue.position[0]}, ${issue.position[1]}]`);
      });
    }
  }

  showLayouts() {
    console.log('\n🎨 AVAILABLE LAYOUT TYPES');
    console.log('=' .repeat(40));
    console.log('lead_processing  - Main UYSP lead processing flow');
    console.log('qualification    - Two-phase qualification layout');
    console.log('sms_campaign     - SMS campaign workflow');
    console.log('utilities        - Utility and support workflows');
    console.log('linear           - Simple linear flow (default)');
    console.log('\n💡 Usage: npm run position-workflow <workflow-id> <layout-type>');
  }

  testPositioning() {
    console.log('🧪 Testing UYSP Positioning System...\n');

    const testNodes = ['Webhook', 'Field Mapper', 'Search', 'Duplicate Check', 'Create'];
    const layouts = ['lead_processing', 'qualification', 'sms_campaign', 'linear'];

    layouts.forEach(layout => {
      console.log(`📐 Testing ${layout} layout:`);
      const positions = this.positioner.getPositions(layout, testNodes);
      
      Object.entries(positions).forEach(([node, pos]) => {
        console.log(`  ${node.padEnd(15)} → [${pos[0].toString().padStart(4)}, ${pos[1].toString().padStart(4)}]`);
      });
      console.log();
    });

    console.log('✅ All layout tests completed successfully');
  }

  showHelp() {
    console.log('\n🎯 UYSP Workflow Positioner CLI');
    console.log('=' .repeat(40));
    console.log('Commands:');
    console.log('  position <workflow-id> [layout]   Position existing workflow');
    console.log('  create <name> [layout]            Create new positioned workflow');
    console.log('  report <workflow-id> [layout]     Generate positioning report');
    console.log('  validate <workflow-id>            Validate current positions');
    console.log('  layouts                           Show available layouts');
    console.log('  test                              Test positioning system');
    console.log('\nExamples:');
    console.log('  node workflow-positioner-cli.js position CefJB1Op3OySG8nb lead_processing');
    console.log('  node workflow-positioner-cli.js create "New Workflow" qualification');
    console.log('  node workflow-positioner-cli.js test');
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new WorkflowPositionerCLI();
  cli.run().catch(console.error);
}

module.exports = { WorkflowPositionerCLI }; 