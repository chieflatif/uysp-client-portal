// UYSP Workflow Positioning Utilities
// Batch operations, validation, and position management

const { UYSPPositioning } = require('./smart-positioning.js');

class WorkflowPositioningUtils {
  constructor() {
    this.positioner = new UYSPPositioning();
    this.maxOperationsPerBatch = 5; // n8n limit
  }

  // Generate positioning operations for existing workflow
  generatePositioningOperations(workflowData, layoutType = 'lead_processing') {
    const nodeNames = workflowData.nodes.map(node => node.name);
    const positions = this.positioner.getPositions(layoutType, nodeNames);
    
    const operations = [];
    
    workflowData.nodes.forEach(node => {
      const position = positions[node.name] || positions[node.id];
      if (position) {
        operations.push({
          type: 'moveNode',
          nodeId: node.id,
          position: position
        });
      }
    });
    
    return operations;
  }

  // Split operations into batches for n8n
  batchOperations(operations) {
    const batches = [];
    for (let i = 0; i < operations.length; i += this.maxOperationsPerBatch) {
      batches.push(operations.slice(i, i + this.maxOperationsPerBatch));
    }
    return batches;
  }

  // Validate positioning doesn't create overlaps
  validatePositions(positions) {
    const issues = [];
    const positionMap = new Map();
    
    Object.entries(positions).forEach(([nodeName, [x, y]]) => {
      const key = `${x},${y}`;
      if (positionMap.has(key)) {
        issues.push({
          type: 'OVERLAP',
          nodes: [positionMap.get(key), nodeName],
          position: [x, y]
        });
      } else {
        positionMap.set(key, nodeName);
      }
    });
    
    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  // Generate workflow creation with smart positioning
  generateWorkflowWithPositioning(workflowName, layoutType, nodeConfigs) {
    const nodeNames = nodeConfigs.map(config => config.name);
    const positions = this.positioner.getPositions(layoutType, nodeNames);
    
    // Apply positions to node configs
    const nodes = nodeConfigs.map((config, index) => ({
      ...config,
      id: config.id || `node-${index + 1}`,
      position: positions[config.name] || this.positioner.getDefaultPosition(index)
    }));
    
    return {
      name: workflowName,
      nodes: nodes,
      connections: this.generateConnections(nodes, layoutType),
      settings: {
        executionOrder: 'v1'
      }
    };
  }

  // Generate connections based on layout type
  generateConnections(nodes, layoutType) {
    const connections = {};
    
    if (layoutType === 'lead_processing') {
      // Linear flow with branching
      for (let i = 0; i < nodes.length - 1; i++) {
        const currentNode = nodes[i];
        const nextNode = nodes[i + 1];
        
        connections[currentNode.name] = {
          main: [[{
            node: nextNode.name,
            type: 'main',
            index: 0
          }]]
        };
      }
    }
    
    return connections;
  }

  // Create positioning report
  generatePositioningReport(workflowData, layoutType) {
    const nodeNames = workflowData.nodes.map(node => node.name);
    const positions = this.positioner.getPositions(layoutType, nodeNames);
    const validation = this.validatePositions(positions);
    
    return {
      workflowId: workflowData.id,
      workflowName: workflowData.name,
      layoutType: layoutType,
      nodeCount: workflowData.nodes.length,
      positionsGenerated: Object.keys(positions).length,
      validation: validation,
      positionMap: positions,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = { WorkflowPositioningUtils }; 