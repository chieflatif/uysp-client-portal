// UYSP Smart Positioning System
// Eliminates spaghetti workflows with calculated coordinates

class UYSPPositioning {
  constructor() {
    this.baseSpacing = 200;  // 200px between nodes
    this.branchSpacing = 150; // 150px between branches
    this.startX = 250;
    this.startY = 300;
  }

  // Main positioning function for UYSP workflows
  getPositions(workflowType, nodeNames) {
    switch(workflowType) {
      case 'lead_processing':
        return this.getLeadProcessingLayout(nodeNames);
      case 'qualification':
        return this.getQualificationLayout(nodeNames);
      case 'sms_campaign':
        return this.getSMSLayout(nodeNames);
      case 'utilities':
        return this.getUtilitiesLayout(nodeNames);
      default:
        return this.getLinearLayout(nodeNames);
    }
  }

  // UYSP Lead Processing Main Flow Layout
  getLeadProcessingLayout(nodeNames) {
    const positions = {};
    let x = this.startX;
    let y = this.startY;

    // Webhook reception (left)
    positions['Kajabi Webhook'] = [x, y];
    positions['webhook'] = [x, y];
    positions['Validate API Key (Dynamic)'] = [x + 200, y];
    positions['Smart Field Mapper'] = [x + 400, y];
    positions['field_mapper'] = [x + 400, y];
    
    // Identity resolution (center-left)
    x += 600;
    positions['Check Unknown Fields'] = [x, y];
    positions['test_mode_check'] = [x, y];
    positions['Airtable Search (Dynamic)'] = [x + 200, y];
    positions['identity_search'] = [x + 200, y];
    positions['Duplicate Handler (Dynamic)'] = [x + 400, y];
    positions['duplicate_check'] = [x + 400, y];
    
    // Branching for create/update
    positions['Route by Duplicate'] = [x + 600, y];
    positions['Airtable Create (Dynamic)'] = [x + 800, y - 75];
    positions['create_record'] = [x + 800, y - 75];
    positions['Airtable Upsert (Dynamic)'] = [x + 800, y + 75];
    positions['update_record'] = [x + 800, y + 75];
    positions['End Node (Dynamic)'] = [x + 1000, y];
    positions['merge_paths'] = [x + 1000, y];
    
    // Session 2 compliance nodes (lower branch)
    positions['DND List Check'] = [x, y + 200];
    positions['Time Window Validator'] = [x + 200, y + 200];
    positions['Monthly SMS Budget Check'] = [x + 400, y + 200];
    positions['SMS Compliance Gate'] = [x + 600, y + 200];
    
    return positions;
  }

  // Two-Phase Qualification Layout
  getQualificationLayout(nodeNames) {
    const positions = {};
    let x = this.startX;
    
    // Phase 1: Company Check (top branch)
    positions['Cost Budget Check'] = [x, 200];
    positions['cost_check'] = [x, 200];
    positions['Apollo Cache Check'] = [x + 200, 200];
    positions['cache_check'] = [x + 200, 200];
    positions['Apollo Org API'] = [x + 400, 200];
    positions['apollo_org'] = [x + 400, 200];
    positions['Company Qualification'] = [x + 600, 200];
    positions['company_decision'] = [x + 600, 200];
    
    // Phase 2: Person Enrichment (middle)
    positions['Apollo People API'] = [x + 400, 350];
    positions['apollo_person'] = [x + 400, 350];
    positions['Person Qualification'] = [x + 600, 350];
    positions['person_decision'] = [x + 600, 350];
    
    // Scoring & Routing (right)
    positions['ICP Scoring Engine'] = [x + 800, 275];
    positions['icp_scoring'] = [x + 800, 275];
    positions['Qualification Router'] = [x + 1000, 275];
    positions['routing_decision'] = [x + 1000, 275];
    
    // End states (far right)
    positions['SMS Campaign Queue'] = [x + 1200, 200];
    positions['qualified_sms'] = [x + 1200, 200];
    positions['Human Review Queue'] = [x + 1200, 300];
    positions['human_review'] = [x + 1200, 300];
    positions['Archive Low Score'] = [x + 1200, 400];
    positions['archive'] = [x + 1200, 400];
    
    return positions;
  }

  // SMS Campaign Layout
  getSMSLayout(nodeNames) {
    const positions = {};
    let x = this.startX;
    let y = this.startY;

    // Compliance checks (left)
    positions['DND List Check'] = [x, y - 100];
    positions['dnd_check'] = [x, y - 100];
    positions['TCPA Time Window'] = [x, y];
    positions['time_window'] = [x, y];
    positions['10DLC Monthly Limit'] = [x, y + 100];
    positions['monthly_limit'] = [x, y + 100];
    positions['SMS Compliance Gate'] = [x + 200, y];
    positions['compliance_gate'] = [x + 200, y];
    
    // SMS generation (center)
    positions['Template Engine'] = [x + 400, y];
    positions['template_engine'] = [x + 400, y];
    positions['Personalization'] = [x + 600, y];
    positions['personalization'] = [x + 600, y];
    
    // Sending (right)
    positions['SimpleTexting SMS'] = [x + 800, y];
    positions['sms_send'] = [x + 800, y];
    positions['Communication Log'] = [x + 1000, y];
    positions['tracking_log'] = [x + 1000, y];
    
    return positions;
  }

  // Utilities Layout (vertical stack)
  getUtilitiesLayout(nodeNames) {
    const positions = {};
    let x = this.startX;
    let y = this.startY;

    nodeNames.forEach((name, index) => {
      positions[name] = [x, y + (index * 100)];
    });
    
    return positions;
  }

  // Simple linear layout fallback
  getLinearLayout(nodeNames) {
    const positions = {};
    nodeNames.forEach((name, index) => {
      positions[name] = [
        this.startX + (index * this.baseSpacing),
        this.startY
      ];
    });
    return positions;
  }

  // Default position for unknown nodes
  getDefaultPosition(index) {
    return [this.startX + (index * this.baseSpacing), this.startY];
  }

  // Apply positions to n8n nodes array
  applyPositions(nodes, positions) {
    return nodes.map(node => ({
      ...node,
      position: positions[node.name] || positions[node.id] || [250, 300]
    }));
  }

  // Generate positioning for existing workflow
  generatePositioningForWorkflow(workflowData, workflowType = 'lead_processing') {
    const nodeNames = workflowData.nodes.map(n => n.name);
    const positions = this.getPositions(workflowType, nodeNames);
    
    // Create positioning operations for partial workflow update
    const operations = [];
    workflowData.nodes.forEach(node => {
      const position = positions[node.name];
      if (position) {
        operations.push({
          type: "moveNode",
          nodeId: node.id,
          position: position
        });
      }
    });
    
    return operations;
  }
}

// Updated workflow creation with smart positioning
async function createUYSPWorkflow(workflowConfig) {
  const positioner = new UYSPPositioning();
  
  // Extract node names
  const nodeNames = workflowConfig.nodes.map(n => n.name);
  
  // Get optimal positions
  const positions = positioner.getPositions(
    workflowConfig.workflowType || 'linear', 
    nodeNames
  );
  
  // Apply positions to nodes
  const positionedNodes = positioner.applyPositions(
    workflowConfig.nodes, 
    positions
  );
  
  // Create workflow with positioned nodes
  return {
    ...workflowConfig,
    nodes: positionedNodes
  };
}

// Retrofit existing workflows
async function repositionExistingWorkflow(workflowData, workflowType) {
  const positioner = new UYSPPositioning();
  const operations = positioner.generatePositioningForWorkflow(workflowData, workflowType);
  
  return {
    success: operations.length > 0,
    operations: operations,
    nodeCount: workflowData.nodes.length
  };
}

// Export for use in workflow creation
module.exports = { 
  UYSPPositioning, 
  createUYSPWorkflow, 
  repositionExistingWorkflow 
}; 