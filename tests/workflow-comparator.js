#!/usr/bin/env node

/**
 * WORKFLOW COMPARISON & STRATEGIC ANALYSIS
 * 
 * Compares multiple workflows systematically
 * Identifies strengths, weaknesses, optimal choices
 * Generates strategic recommendations
 */

const WorkflowAnalysisEngine = require('./workflow-analysis-engine');

class WorkflowComparator {
  constructor() {
    this.engine = new WorkflowAnalysisEngine();
    this.comparisons = [];
    
    console.log('🔄 WORKFLOW COMPARATOR INITIALIZED');
  }

  /**
   * COMPARE MULTIPLE WORKFLOWS
   * Deep analysis and comparison of workflow capabilities and performance
   */
  async compareWorkflows(workflowSpecs, testLimit = 3) {
    console.log('\n🔄 COMPREHENSIVE WORKFLOW COMPARISON');
    console.log('=====================================');
    
    const comparison = {
      timestamp: new Date().toISOString(),
      workflows: [],
      analysis: null,
      recommendations: null,
      testResults: new Map()
    };

    // Analyze each workflow
    for (const spec of workflowSpecs) {
      console.log(`\n📊 Analyzing ${spec.name || spec.id}...`);
      
      // Deep workflow analysis
      const analysis = await this.engine.analyzeWorkflow(spec.id, spec.name);
      
      // Run tests if requested
      let testResults = null;
      if (testLimit > 0) {
        console.log(`🧪 Running ${testLimit} tests...`);
        testResults = await this.engine.runComprehensiveTesting(spec.id, testLimit);
      }
      
      comparison.workflows.push({
        spec,
        analysis,
        testResults
      });
      
      if (testResults) {
        comparison.testResults.set(spec.id, testResults);
      }
    }

    // Generate comparative analysis
    comparison.analysis = this.generateComparativeAnalysis(comparison.workflows);
    
    // Generate strategic recommendations
    comparison.recommendations = this.generateStrategicRecommendations(comparison);
    
    // Store comparison
    this.comparisons.push(comparison);
    
    // Save detailed report
    await this.saveComparisonReport(comparison);
    
    console.log('\n✅ Workflow comparison complete');
    this.printExecutiveSummary(comparison);
    
    return comparison;
  }

  /**
   * COMPARATIVE ANALYSIS
   * Side-by-side comparison of workflow capabilities and performance
   */
  generateComparativeAnalysis(workflows) {
    const analysis = {
      capabilityMatrix: {},
      performanceComparison: {},
      complexityAnalysis: {},
      maturityAssessment: {},
      strengthsWeaknesses: {}
    };

    // Build capability matrix
    const allCapabilities = new Set();
    workflows.forEach(w => {
      if (w.analysis.capabilities) {
        Object.keys(w.analysis.capabilities).forEach(cap => allCapabilities.add(cap));
      }
    });

    allCapabilities.forEach(capability => {
      analysis.capabilityMatrix[capability] = {};
      workflows.forEach(w => {
        const id = w.spec.id;
        const value = w.analysis.capabilities?.[capability];
        analysis.capabilityMatrix[capability][id] = value;
      });
    });

    // Performance comparison
    workflows.forEach(w => {
      const id = w.spec.id;
      const perf = w.analysis.performance;
      
      analysis.performanceComparison[id] = {
        reliability: perf?.reliability || 0,
        averageDuration: perf?.averageDuration || 0,
        totalExecutions: perf?.totalExecutions || 0
      };
    });

    // Complexity analysis
    workflows.forEach(w => {
      const id = w.spec.id;
      const nodes = w.analysis.nodes;
      
      analysis.complexityAnalysis[id] = {
        totalNodes: nodes?.totalNodes || 0,
        complexityScore: nodes?.complexityScore || 0,
        criticalNodes: nodes?.criticalNodes?.length || 0
      };
    });

    // Maturity assessment
    workflows.forEach(w => {
      const id = w.spec.id;
      const caps = w.analysis.capabilities;
      
      analysis.maturityAssessment[id] = {
        maturityLevel: caps?.maturityLevel || 'unknown',
        totalFeatures: caps?.totalFeatures || 0,
        sessionType: caps?.sessionType || 'unknown'
      };
    });

    // Strengths and weaknesses analysis
    workflows.forEach(w => {
      const id = w.spec.id;
      analysis.strengthsWeaknesses[id] = this.analyzeStrengthsWeaknesses(w);
    });

    return analysis;
  }

  /**
   * STRATEGIC RECOMMENDATIONS
   * Actionable insights based on comparison analysis
   */
  generateStrategicRecommendations(comparison) {
    const recommendations = {
      optimalChoice: null,
      improvements: [],
      riskAssessment: {},
      migration: null,
      nextSteps: []
    };

    const workflows = comparison.workflows;
    const analysis = comparison.analysis;

    // Determine optimal choice
    recommendations.optimalChoice = this.determineOptimalWorkflow(workflows, analysis);
    
    // Identify improvement opportunities
    recommendations.improvements = this.identifyImprovements(workflows, analysis);
    
    // Risk assessment
    recommendations.riskAssessment = this.assessRisks(workflows, analysis);
    
    // Migration recommendations
    if (workflows.length > 1) {
      recommendations.migration = this.generateMigrationPlan(workflows, recommendations.optimalChoice);
    }
    
    // Next steps
    recommendations.nextSteps = this.generateNextSteps(recommendations);

    return recommendations;
  }

  /**
   * DETERMINE OPTIMAL WORKFLOW
   * Scores workflows across multiple dimensions
   */
  determineOptimalWorkflow(workflows, analysis) {
    const scores = workflows.map(w => {
      const id = w.spec.id;
      let score = 0;
      
      // Capability score (40% weight)
      const capabilities = analysis.maturityAssessment[id]?.totalFeatures || 0;
      score += capabilities * 0.4;
      
      // Performance score (30% weight)
      const reliability = analysis.performanceComparison[id]?.reliability || 0;
      score += (reliability / 100) * 30 * 0.3;
      
      // Maturity score (20% weight)
      const maturityLevels = { 'minimal': 1, 'basic': 2, 'intermediate': 3, 'advanced': 4 };
      const maturity = maturityLevels[analysis.maturityAssessment[id]?.maturityLevel] || 0;
      score += maturity * 5 * 0.2;
      
      // Complexity penalty (10% weight) - lower complexity is better
      const complexity = analysis.complexityAnalysis[id]?.complexityScore || 0;
      score -= (complexity / 50) * 10 * 0.1; // Normalize and penalize
      
      return {
        workflowId: id,
        workflowName: w.spec.name || id,
        score: Math.round(score * 100) / 100,
        reasoning: this.generateScoreReasoning(w, analysis, id)
      };
    });

    // Sort by score
    scores.sort((a, b) => b.score - a.score);
    
    return {
      winner: scores[0],
      rankings: scores,
      confidence: this.calculateConfidence(scores)
    };
  }

  /**
   * IDENTIFY IMPROVEMENTS
   * Specific actionable improvements for each workflow
   */
  identifyImprovements(workflows, analysis) {
    const improvements = [];

    workflows.forEach(w => {
      const id = w.spec.id;
      const workflowImprovements = {
        workflowId: id,
        workflowName: w.spec.name || id,
        critical: [],
        recommended: [],
        optional: []
      };

      // Check for missing critical capabilities
      const caps = w.analysis.capabilities || {};
      
      if (!caps.errorHandling) {
        workflowImprovements.critical.push({
          issue: 'No error handling detected',
          impact: 'High risk of failures without proper recovery',
          solution: 'Add retry logic and error handling to critical nodes'
        });
      }
      
      if (!caps.retryLogic) {
        workflowImprovements.critical.push({
          issue: 'No retry logic configured',
          impact: 'Transient failures will cause complete workflow failure',
          solution: 'Configure retryOnFail and maxTries for API nodes'
        });
      }
      
      if (!caps.logging) {
        workflowImprovements.recommended.push({
          issue: 'Limited logging capability',
          impact: 'Difficult to debug issues and track performance',
          solution: 'Add logging nodes for key decision points'
        });
      }

      // Performance improvements
      const perf = analysis.performanceComparison[id];
      if (perf?.reliability < 95) {
        workflowImprovements.critical.push({
          issue: `Low reliability: ${perf.reliability}%`,
          impact: 'Frequent failures impact business operations',
          solution: 'Investigate and fix failure patterns'
        });
      }

      improvements.push(workflowImprovements);
    });

    return improvements;
  }

  /**
   * ASSESS RISKS
   * Identify potential risks for each workflow
   */
  assessRisks(workflows, analysis) {
    const risks = {};

    workflows.forEach(w => {
      const id = w.spec.id;
      const workflowRisks = {
        high: [],
        medium: [],
        low: []
      };

      const complexity = analysis.complexityAnalysis[id];
      const performance = analysis.performanceComparison[id];
      const capabilities = w.analysis.capabilities || {};

      // High risks
      if (performance?.reliability < 90) {
        workflowRisks.high.push('Reliability below acceptable threshold');
      }
      
      if (!capabilities.errorHandling) {
        workflowRisks.high.push('No error handling - single point of failure');
      }

      // Medium risks
      if (complexity?.complexityScore > 30) {
        workflowRisks.medium.push('High complexity may impact maintainability');
      }
      
      if (complexity?.totalNodes > 15) {
        workflowRisks.medium.push('Large workflow may be difficult to debug');
      }

      // Low risks
      if (!capabilities.logging) {
        workflowRisks.low.push('Limited observability');
      }

      risks[id] = workflowRisks;
    });

    return risks;
  }

  /**
   * GENERATE MIGRATION PLAN
   * Plan for moving from current to optimal workflow
   */
  generateMigrationPlan(workflows, optimalChoice) {
    if (!optimalChoice) return null;

    const currentWorkflows = workflows.filter(w => w.spec.id !== optimalChoice.winner.workflowId);
    
    return {
      from: currentWorkflows.map(w => ({ id: w.spec.id, name: w.spec.name })),
      to: { id: optimalChoice.winner.workflowId, name: optimalChoice.winner.workflowName },
      strategy: 'gradual-migration',
      steps: [
        'Run parallel testing to validate optimal workflow',
        'Migrate test traffic to new workflow',
        'Monitor performance and reliability',
        'Gradually increase traffic percentage',
        'Complete migration when confidence is high',
        'Archive old workflows'
      ],
      estimatedDuration: '2-4 weeks',
      riskMitigation: [
        'Maintain rollback capability',
        'Monitor key metrics continuously',
        'Test with real production data'
      ]
    };
  }

  /**
   * GENERATE NEXT STEPS
   * Actionable immediate next steps
   */
  generateNextSteps(recommendations) {
    const nextSteps = [];

    if (recommendations.optimalChoice) {
      nextSteps.push({
        priority: 'HIGH',
        action: `Validate optimal workflow: ${recommendations.optimalChoice.winner.workflowName}`,
        timeline: 'This week',
        owner: 'Development Team'
      });
    }

    // Critical improvements
    recommendations.improvements.forEach(improvement => {
      improvement.critical.forEach(item => {
        nextSteps.push({
          priority: 'HIGH',
          action: `Fix: ${item.issue} in ${improvement.workflowName}`,
          timeline: 'Next 2 weeks',
          owner: 'Development Team'
        });
      });
    });

    // Migration planning
    if (recommendations.migration) {
      nextSteps.push({
        priority: 'MEDIUM',
        action: 'Plan migration strategy and timeline',
        timeline: 'Next week',
        owner: 'Technical Lead'
      });
    }

    return nextSteps;
  }

  /**
   * PRINT EXECUTIVE SUMMARY
   * High-level summary for quick decision making
   */
  printExecutiveSummary(comparison) {
    console.log('\n📋 EXECUTIVE SUMMARY');
    console.log('===================');
    
    const optimal = comparison.recommendations.optimalChoice;
    if (optimal) {
      console.log(`🏆 RECOMMENDED WORKFLOW: ${optimal.winner.workflowName}`);
      console.log(`📊 Score: ${optimal.winner.score}/100`);
      console.log(`🎯 Confidence: ${optimal.confidence}%`);
    }

    console.log('\n🔍 KEY FINDINGS:');
    comparison.workflows.forEach(w => {
      const caps = w.analysis.capabilities;
      console.log(`   ${w.spec.name || w.spec.id}: ${caps?.totalFeatures || 0} features, ${caps?.maturityLevel || 'unknown'} maturity`);
    });

    console.log('\n⚠️  CRITICAL ACTIONS NEEDED:');
    let actionCount = 0;
    comparison.recommendations.improvements.forEach(improvement => {
      improvement.critical.forEach(item => {
        if (actionCount < 3) { // Top 3 critical items
          console.log(`   • ${item.issue} (${improvement.workflowName})`);
          actionCount++;
        }
      });
    });

    if (comparison.recommendations.migration) {
      console.log(`\n🔄 MIGRATION: ${comparison.recommendations.migration.estimatedDuration}`);
    }
  }

  /**
   * SAVE COMPARISON REPORT
   * Save detailed analysis to file
   */
  async saveComparisonReport(comparison) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `workflow-comparison-${timestamp}.json`;
    const filepath = path.join(this.engine.resultsDir, filename);
    
    const report = {
      ...comparison,
      // Convert Map to Object for JSON serialization
      testResults: Object.fromEntries(comparison.testResults)
    };
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`💾 Detailed report saved: ${filename}`);
  }

  // Helper methods
  analyzeStrengthsWeaknesses(workflow) {
    const strengths = [];
    const weaknesses = [];
    
    const caps = workflow.analysis.capabilities || {};
    const perf = workflow.analysis.performance || {};
    
    // Strengths
    if (caps.totalFeatures >= 8) strengths.push('Rich feature set');
    if (perf.reliability >= 95) strengths.push('High reliability');
    if (caps.errorHandling) strengths.push('Robust error handling');
    
    // Weaknesses
    if (caps.totalFeatures < 5) weaknesses.push('Limited capabilities');
    if (perf.reliability < 90) weaknesses.push('Reliability concerns');
    if (!caps.retryLogic) weaknesses.push('No retry logic');
    
    return { strengths, weaknesses };
  }

  generateScoreReasoning(workflow, analysis, id) {
    const reasons = [];
    
    const caps = analysis.maturityAssessment[id];
    const perf = analysis.performanceComparison[id];
    
    if (caps?.totalFeatures >= 8) reasons.push('Strong feature set');
    if (perf?.reliability >= 95) reasons.push('High reliability');
    if (caps?.maturityLevel === 'advanced') reasons.push('Advanced maturity');
    
    return reasons.join(', ') || 'Basic scoring';
  }

  calculateConfidence(scores) {
    if (scores.length < 2) return 100;
    
    const topScore = scores[0].score;
    const secondScore = scores[1].score;
    const gap = topScore - secondScore;
    
    // Higher gap = higher confidence
    return Math.min(100, Math.round(50 + (gap * 10)));
  }
}

module.exports = WorkflowComparator;

// CLI execution
if (require.main === module) {
  console.log('🔄 WORKFLOW COMPARATOR');
  console.log('Compare multiple workflows systematically');
  console.log('Example: await comparator.compareWorkflows([{id: "workflow1", name: "Version 1"}]);');
}