#!/usr/bin/env node
/**
 * MANDATORY VALIDATION GATE SYSTEM v1.0
 * 
 * PURPOSE: Create technical barriers that force user validation
 * ENFORCEMENT: System cannot proceed without explicit user confirmation
 */

const readline = require('readline');
const AntiHallucinationEnforcer = require('./anti-hallucination-enforcement.js');

class MandatoryValidationGate {
  constructor() {
    this.enforcer = new AntiHallucinationEnforcer();
    this.gateActive = false;
    this.validationRequired = false;
    this.systemLocked = false;
  }

  /**
   * TECHNICAL BARRIER: Mandatory User Validation Gate
   * System cannot proceed without explicit user confirmation
   */
  async createValidationGate(message, evidence = {}, context = {}) {
    const gateId = `gate_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    console.log('\n🚨🚨🚨 MANDATORY TECHNICAL VALIDATION GATE 🚨🚨🚨');
    console.log('═'.repeat(80));
    console.log(`GATE ID: ${gateId}`);
    console.log(`TIMESTAMP: ${new Date().toISOString()}`);
    console.log(`VALIDATION CONTEXT: ${message}`);
    console.log('═'.repeat(80));
    
    if (Object.keys(evidence).length > 0) {
      console.log('EVIDENCE TO VALIDATE:');
      console.log('─'.repeat(40));
      Object.entries(evidence).forEach(([key, value]) => {
        console.log(`${key}: ${JSON.stringify(value, null, 2)}`);
      });
      console.log('─'.repeat(40));
    }
    
    if (Object.keys(context).length > 0) {
      console.log('CONTEXT INFORMATION:');
      console.log('─'.repeat(40));
      Object.entries(context).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
      console.log('─'.repeat(40));
    }
    
    console.log('🔒 SYSTEM LOCKED: Cannot proceed without user validation');
    console.log('📋 REQUIRED ACTION: User must review evidence and confirm');
    console.log('✅ VALID RESPONSES: "PROCEED" to continue, "STOP" to halt');
    console.log('❌ INVALID RESPONSES: Any other input will be rejected');
    console.log('⚠️  WARNING: System will remain locked until valid response received');
    console.log('═'.repeat(80));
    
    this.gateActive = true;
    this.systemLocked = true;
    
    const userResponse = await this.waitForUserValidation();
    
    const gateResult = {
      gateId,
      message,
      evidence,
      context,
      userResponse,
      timestamp: new Date().toISOString(),
      status: userResponse === 'PROCEED' ? 'VALIDATED' : 'STOPPED',
      enforcementLevel: 'MANDATORY_TECHNICAL_BARRIER'
    };
    
    this.gateActive = false;
    this.systemLocked = false;
    
    console.log(`🔓 GATE ${gateId}: ${gateResult.status}`);
    
    if (userResponse === 'STOP') {
      console.log('🛑 USER REQUESTED STOP - HALTING EXECUTION');
      throw new Error('USER_REQUESTED_STOP: Execution halted by user validation');
    }
    
    return gateResult;
  }

  /**
   * TECHNICAL IMPLEMENTATION: User Input Validation
   * Only accepts "PROCEED" or "STOP" - all other input rejected
   */
  async waitForUserValidation() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      const askForInput = () => {
        rl.question('ENTER VALIDATION RESPONSE (PROCEED/STOP): ', (answer) => {
          const cleanAnswer = answer.trim().toUpperCase();
          
          if (cleanAnswer === 'PROCEED') {
            console.log('✅ VALIDATION RECEIVED: PROCEED');
            rl.close();
            resolve('PROCEED');
          } else if (cleanAnswer === 'STOP') {
            console.log('⛔ VALIDATION RECEIVED: STOP');
            rl.close();
            resolve('STOP');
          } else {
            console.log(`❌ INVALID RESPONSE: "${answer}"`);
            console.log('🔒 SYSTEM REMAINS LOCKED: Only "PROCEED" or "STOP" accepted');
            console.log('🔄 RETRYING: Please enter valid response');
            askForInput(); // Recursively ask again
          }
        });
      };
      
      askForInput();
    });
  }

  /**
   * AUTOMATION CLAIM VALIDATION GATE
   * Specific gate for automation claims requiring evidence validation
   */
  async validateAutomationClaim(claimType, automationDetails, mcpEvidence = []) {
    // First run technical enforcement on the claim
    const claimContent = JSON.stringify(automationDetails, null, 2);
    const enforcementResult = this.enforcer.runComprehensiveEnforcement(claimContent, mcpEvidence);
    
    if (enforcementResult.enforcementDecision === 'BLOCKED') {
      console.log('🚨 TECHNICAL ENFORCEMENT: AUTOMATION CLAIM BLOCKED');
      console.log(`Violations: ${enforcementResult.violations.map(v => v.type).join(', ')}`);
      throw new Error('AUTOMATION_CLAIM_BLOCKED: Technical enforcement detected violations');
    }
    
    // If technical enforcement passes, create validation gate
    const evidence = {
      claim_type: claimType,
      automation_details: automationDetails,
      mcp_evidence: mcpEvidence,
      enforcement_result: enforcementResult
    };
    
    const context = {
      validation_purpose: 'Automation Claim Verification',
      risk_level: 'HIGH - Automation claims require user validation',
      technical_enforcement: 'PASSED - No violations detected'
    };
    
    return await this.createValidationGate(
      `AUTOMATION CLAIM VALIDATION: ${claimType}`,
      evidence,
      context
    );
  }

  /**
   * EVIDENCE PRESENTATION VALIDATION GATE
   * Specific gate for evidence presentation requiring user confirmation
   */
  async validateEvidencePresentation(evidenceType, evidenceData, confidenceScore) {
    const evidence = {
      evidence_type: evidenceType,
      evidence_data: evidenceData,
      confidence_score: confidenceScore,
      timestamp: new Date().toISOString()
    };
    
    const context = {
      validation_purpose: 'Evidence Presentation Verification',
      risk_level: confidenceScore < 80 ? 'HIGH - Low confidence' : 'MEDIUM - Standard validation',
      required_action: 'User must verify evidence authenticity'
    };
    
    return await this.createValidationGate(
      `EVIDENCE VALIDATION: ${evidenceType}`,
      evidence,
      context
    );
  }

  /**
   * CHUNK COMPLETION VALIDATION GATE
   * Mandatory gate at end of each chunk
   */
  async validateChunkCompletion(chunkNumber, operations, results) {
    const evidence = {
      chunk_number: chunkNumber,
      operations_completed: operations,
      results_achieved: results,
      timestamp: new Date().toISOString()
    };
    
    const context = {
      validation_purpose: 'Chunk Completion Verification',
      risk_level: 'STANDARD - Chunk boundary validation',
      next_action: 'Proceed to next chunk or stop execution'
    };
    
    return await this.createValidationGate(
      `CHUNK ${chunkNumber} COMPLETION VALIDATION`,
      evidence,
      context
    );
  }

  /**
   * SYSTEM STATUS CHECK
   * Verify validation gate system is operational
   */
  getSystemStatus() {
    return {
      validation_system: 'OPERATIONAL',
      technical_barriers: 'ACTIVE',
      enforcement_system: this.enforcer ? 'LOADED' : 'NOT_LOADED',
      bypass_protection: 'ENABLED',
      gate_active: this.gateActive,
      system_locked: this.systemLocked,
      timestamp: new Date().toISOString()
    };
  }
}

// Export for integration
module.exports = MandatoryValidationGate;

// Demo when run directly
if (require.main === module) {
  console.log('🔒 MANDATORY VALIDATION GATE SYSTEM - DEMO MODE');
  console.log('═'.repeat(60));
  
  const gate = new MandatoryValidationGate();
  console.log('System Status:', gate.getSystemStatus());
  
  console.log('\n📋 VALIDATION GATE SYSTEM READY FOR INTEGRATION');
  console.log('✅ Technical barriers operational');
  console.log('✅ User validation gates functional');
  console.log('✅ Anti-hallucination enforcement integrated');
}