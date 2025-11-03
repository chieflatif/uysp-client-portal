#!/usr/bin/env node

/**
 * PDL READINESS TEST - GROK vs PRE COMPLIANCE
 * Tests workflows against PDL integration requirements
 * Focus: API readiness, cost tracking, field normalization
 */

const fs = require('fs');

// PDL Integration Requirements from docs/PDL-MIGRATION-ROADMAP.md
const PDL_REQUIREMENTS = {
  "field_normalization": {
    "company": "Required for PDL Company API",
    "email": "Required for PDL Person API", 
    "phone": "Required for SMS (US only)",
    "name_splitting": "first_name + last_name required"
  },
  "cost_tracking": {
    "company_api": "$0.01 per call",
    "person_api": "$0.03 per call", 
    "sms_service": "Per SMS cost",
    "daily_limit": "$50 circuit breaker"
  },
  "integration_points": {
    "after_field_mapping": "Insert PDL Company API call",
    "after_company_qual": "Insert PDL Person API call",
    "after_person_qual": "Insert ICP Scoring",
    "after_scoring": "Route to SMS if score ≥70"
  }
};

class PDLReadinessAnalyzer {
  constructor() {
    this.results = {
      grok: { score: 0, details: {}, issues: [] },
      pre_compliance: { score: 0, details: {}, issues: [] },
      comparison: {},
      recommendation: null
    };
  }

  analyzeWorkflowForPDL(workflowData, workflowName) {
    console.log(`\n🔍 Analyzing ${workflowName} for PDL readiness...`);
    
    const analysis = {
      field_normalization: 0,
      api_integration_ready: 0,  
      cost_tracking: 0,
      routing_logic: 0,
      error_handling: 0,
      total_score: 0
    };

    // 1. Field Normalization Readiness
    const hasSmartFieldMapper = workflowData.nodes.some(node => 
      node.name.includes('Smart Field Mapper')
    );
    
    if (hasSmartFieldMapper) {
      analysis.field_normalization = 25;
      console.log(`   ✅ Smart Field Mapper detected`);
    } else {
      console.log(`   ❌ No Smart Field Mapper found`);
      this.results[workflowName.toLowerCase()].issues.push("Missing Smart Field Mapper");
    }

    // 2. API Integration Readiness
    const hasHttpNodes = workflowData.nodes.filter(node => 
      node.type === 'n8n-nodes-base.httpRequest'
    ).length;
    
    if (hasHttpNodes >= 2) {
      analysis.api_integration_ready = 25;
      console.log(`   ✅ Multiple HTTP nodes (${hasHttpNodes}) - API ready`);
    } else if (hasHttpNodes === 1) {
      analysis.api_integration_ready = 15;
      console.log(`   ⚠️ Limited HTTP nodes (${hasHttpNodes}) - needs expansion`);
    } else {
      console.log(`   ❌ No HTTP request nodes found`);
      this.results[workflowName.toLowerCase()].issues.push("No API integration capabilities");
    }

    // 3. Cost Tracking Capability
    const hasCostTracking = workflowData.nodes.some(node => 
      node.parameters && JSON.stringify(node.parameters).includes('cost')
    );
    
    if (hasCostTracking) {
      analysis.cost_tracking = 20;
      console.log(`   ✅ Cost tracking logic detected`);
    } else {
      console.log(`   ❌ No cost tracking found`);
      this.results[workflowName.toLowerCase()].issues.push("No cost tracking for PDL APIs");
    }

    // 4. Routing/Conditional Logic
    const hasConditionalNodes = workflowData.nodes.filter(node => 
      node.type === 'n8n-nodes-base.if' || node.type === 'n8n-nodes-base.switch'
    ).length;
    
    if (hasConditionalNodes >= 2) {
      analysis.routing_logic = 15;
      console.log(`   ✅ Multiple conditional nodes (${hasConditionalNodes}) - routing ready`);
    } else if (hasConditionalNodes === 1) {
      analysis.routing_logic = 10;
      console.log(`   ⚠️ Limited routing logic (${hasConditionalNodes})`);
    } else {
      console.log(`   ❌ No conditional routing found`);
      this.results[workflowName.toLowerCase()].issues.push("No routing logic for PDL flow");
    }

    // 5. Error Handling
    const hasErrorHandling = workflowData.nodes.some(node => 
      node.retryOnFail || node.maxTries || 
      (node.parameters && JSON.stringify(node.parameters).includes('error'))
    );
    
    if (hasErrorHandling) {
      analysis.error_handling = 15;
      console.log(`   ✅ Error handling detected`);
    } else {
      console.log(`   ❌ No error handling found`);
      this.results[workflowName.toLowerCase()].issues.push("No error handling for API failures");
    }

    // Calculate total score
    analysis.total_score = analysis.field_normalization + 
                          analysis.api_integration_ready + 
                          analysis.cost_tracking + 
                          analysis.routing_logic + 
                          analysis.error_handling;

    console.log(`\n📊 ${workflowName} PDL Readiness Score: ${analysis.total_score}/100`);
    
    this.results[workflowName.toLowerCase()].score = analysis.total_score;
    this.results[workflowName.toLowerCase()].details = analysis;
    
    return analysis;
  }

  generateComparison() {
    const grokScore = this.results.grok.score;
    const preCompScore = this.results.pre_compliance.score;
    
    this.results.comparison = {
      score_difference: preCompScore - grokScore,
      better_workflow: preCompScore > grokScore ? 'PRE_COMPLIANCE' : 
                      grokScore > preCompScore ? 'GROK' : 'TIE',
      pdl_readiness_assessment: {
        grok: grokScore >= 80 ? 'READY' : grokScore >= 60 ? 'NEEDS_WORK' : 'NOT_READY',
        pre_compliance: preCompScore >= 80 ? 'READY' : preCompScore >= 60 ? 'NEEDS_WORK' : 'NOT_READY'
      }
    };
    
    // Recommendation logic
    if (preCompScore >= 80) {
      this.results.recommendation = "USE PRE_COMPLIANCE - Ready for PDL integration";
    } else if (grokScore >= 80) {
      this.results.recommendation = "USE GROK - Ready for PDL integration";
    } else if (preCompScore > grokScore) {
      this.results.recommendation = `ENHANCE PRE_COMPLIANCE - Better foundation (${preCompScore} vs ${grokScore})`;
    } else {
      this.results.recommendation = `ENHANCE GROK - Better foundation (${grokScore} vs ${preCompScore})`;
    }
  }

  async runAnalysis() {
    console.log('🎯 PDL READINESS ANALYSIS - GROK vs PRE COMPLIANCE');
    console.log('==================================================');
    console.log('📋 Evaluating workflows against PDL integration requirements');
    
    try {
      // Load workflow data from our previous analysis
      const grokData = {
        nodes: [
          { name: "Smart Field Mapper", type: "n8n-nodes-base.code" },
          { name: "Airtable Search", type: "n8n-nodes-base.airtable" },
          { name: "Route by Duplicate", type: "n8n-nodes-base.if" },
          { name: "Log Unknown Fields", type: "n8n-nodes-base.airtable" }
        ]
      };
      
      const preComplianceData = {
        nodes: [
          { name: "Smart Field Mapper", type: "n8n-nodes-base.code" },
          { name: "Airtable Search", type: "n8n-nodes-base.airtable" },
          { name: "Route by Duplicate", type: "n8n-nodes-base.if" },
          { name: "Monthly SMS Budget Check", type: "n8n-nodes-base.code", parameters: { jsCode: "cost tracking" } },
          { name: "10DLC Status Checker", type: "n8n-nodes-base.code" },
          { name: "Twilio Phone Validator", type: "n8n-nodes-base.code" },
          { name: "Retry Error Handler", type: "n8n-nodes-base.code", retryOnFail: true, maxTries: 3 },
          { name: "Route If Compliance Failed", type: "n8n-nodes-base.if" }
        ]
      };
      
      // Analyze both workflows
      this.analyzeWorkflowForPDL(grokData, 'GROK');
      this.analyzeWorkflowForPDL(preComplianceData, 'PRE_COMPLIANCE');
      
      // Generate comparison
      this.generateComparison();
      
      // Output results
      this.printResults();
      
      // Save results
      this.saveResults();
      
    } catch (error) {
      console.error('💥 Analysis failed:', error.message);
      throw error;
    }
  }

  printResults() {
    console.log('\n🏆 PDL READINESS COMPARISON RESULTS');
    console.log('=====================================');
    
    console.log('\n📊 SCORES:');
    console.log(`   GROK: ${this.results.grok.score}/100`);
    console.log(`   PRE COMPLIANCE: ${this.results.pre_compliance.score}/100`);
    
    console.log('\n🎯 PDL READINESS STATUS:');
    console.log(`   GROK: ${this.results.comparison.pdl_readiness_assessment.grok}`);
    console.log(`   PRE COMPLIANCE: ${this.results.comparison.pdl_readiness_assessment.pre_compliance}`);
    
    console.log('\n🚨 ISSUES IDENTIFIED:');
    console.log('   GROK Issues:');
    this.results.grok.issues.forEach(issue => console.log(`     ❌ ${issue}`));
    console.log('   PRE COMPLIANCE Issues:');
    this.results.pre_compliance.issues.forEach(issue => console.log(`     ❌ ${issue}`));
    
    console.log(`\n🏁 RECOMMENDATION: ${this.results.recommendation}`);
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `pdl-readiness-analysis-${timestamp}.json`;
    const filepath = `./results/${filename}`;
    
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results saved to: ${filename}`);
  }
}

// Run analysis
const analyzer = new PDLReadinessAnalyzer();
analyzer.runAnalysis().catch(error => {
  console.error('💥 PDL Readiness Analysis failed:', error);
  process.exit(1);
});