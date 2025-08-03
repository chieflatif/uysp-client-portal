#!/usr/bin/env node
/**
 * MCP EVIDENCE COLLECTOR v1.0
 * 
 * Specialized utility for collecting comprehensive evidence from MCP tool operations
 * Validates that automation claims are backed by real MCP tool results
 * 
 * EVIDENCE TYPES:
 * ✅ Webhook Execution Evidence (N8N execution IDs, response data)
 * ✅ Airtable Record Evidence (Record IDs, field validation)
 * ✅ Performance Evidence (Timing, success rates)
 * ✅ Error Evidence (Failure modes, retry patterns)
 */

const fs = require('fs');
const path = require('path');

class MCPEvidenceCollector {
  constructor() {
    this.evidenceLog = [];
    this.startTime = Date.now();
    this.evidenceDir = path.join(__dirname, 'evidence');
    
    // Ensure evidence directory exists
    if (!fs.existsSync(this.evidenceDir)) {
      fs.mkdirSync(this.evidenceDir, { recursive: true });
    }
  }

  recordMCPOperation(operation) {
    const evidenceEntry = {
      timestamp: new Date().toISOString(),
      operation_id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      mcp_tool: operation.tool,
      test_id: operation.testId,
      parameters: operation.parameters,
      result: operation.result,
      success: operation.success,
      execution_time_ms: operation.executionTime,
      evidence_type: operation.evidenceType,
      confidence_level: operation.confidenceLevel || 'medium'
    };
    
    this.evidenceLog.push(evidenceEntry);
    console.log(`📝 Evidence recorded: ${evidenceEntry.operation_id} (${operation.tool})`);
    return evidenceEntry.operation_id;
  }

  // Evidence collection for webhook triggers
  collectWebhookEvidence(testId, mcpResult, executionTime) {
    return this.recordMCPOperation({
      tool: 'mcp_n8n_n8n_trigger_webhook_workflow',
      testId: testId,
      parameters: {
        webhookUrl: mcpResult.webhookUrl,
        method: mcpResult.method
      },
      result: {
        success: mcpResult.success,
        status: mcpResult.status,
        executionId: mcpResult.executionId,
        recordId: mcpResult.data?.id,
        response_size: JSON.stringify(mcpResult).length
      },
      success: mcpResult.success,
      executionTime: executionTime,
      evidenceType: 'webhook_trigger',
      confidenceLevel: mcpResult.success ? 'high' : 'low'
    });
  }

  // Evidence collection for execution monitoring
  collectExecutionEvidence(testId, mcpResult, executionTime) {
    return this.recordMCPOperation({
      tool: 'mcp_n8n_n8n_get_execution',
      testId: testId,
      parameters: {
        executionId: mcpResult.id
      },
      result: {
        finished: mcpResult.finished,
        mode: mcpResult.mode,
        startedAt: mcpResult.startedAt,
        stoppedAt: mcpResult.stoppedAt,
        duration_ms: mcpResult.stoppedAt ? 
          new Date(mcpResult.stoppedAt) - new Date(mcpResult.startedAt) : null
      },
      success: mcpResult.finished,
      executionTime: executionTime,
      evidenceType: 'execution_monitoring',
      confidenceLevel: mcpResult.finished ? 'high' : 'medium'
    });
  }

  // Evidence collection for Airtable verification
  collectAirtableEvidence(testId, mcpResult, executionTime) {
    const recordFound = mcpResult.found || (mcpResult.records && mcpResult.records.length > 0);
    const record = mcpResult.record || (mcpResult.records && mcpResult.records[0]);
    
    return this.recordMCPOperation({
      tool: 'mcp_airtable_search_records',
      testId: testId,
      parameters: {
        baseId: mcpResult.baseId,
        tableId: mcpResult.tableId,
        searchTerm: mcpResult.searchTerm
      },
      result: {
        found: recordFound,
        recordId: record?.id,
        email: record?.fields?.email,
        field_mapping_success_rate: record?.fields?.field_mapping_success_rate,
        normalization_version: record?.fields?.normalization_version,
        created_date: record?.fields?.created_date,
        field_count: record?.fields ? Object.keys(record.fields).length : 0
      },
      success: recordFound,
      executionTime: executionTime,
      evidenceType: 'airtable_verification',
      confidenceLevel: recordFound ? 'high' : 'low'
    });
  }

  // Cross-reference evidence for end-to-end validation
  validateEndToEndEvidence(testId) {
    const testEvidence = this.evidenceLog.filter(e => e.test_id === testId);
    
    const validation = {
      test_id: testId,
      evidence_count: testEvidence.length,
      webhook_triggered: testEvidence.some(e => e.mcp_tool === 'mcp_n8n_n8n_trigger_webhook_workflow' && e.success),
      execution_completed: testEvidence.some(e => e.mcp_tool === 'mcp_n8n_n8n_get_execution' && e.success),
      record_verified: testEvidence.some(e => e.mcp_tool === 'mcp_airtable_search_records' && e.success),
      end_to_end_success: false,
      evidence_chain: testEvidence.map(e => ({
        tool: e.mcp_tool,
        success: e.success,
        operation_id: e.operation_id
      }))
    };
    
    validation.end_to_end_success = validation.webhook_triggered && 
                                   validation.execution_completed && 
                                   validation.record_verified;
    
    console.log(`🔗 End-to-end validation for ${testId}: ${validation.end_to_end_success ? '✅ PASS' : '❌ FAIL'}`);
    return validation;
  }

  // Generate evidence summary for test run
  generateEvidenceSummary() {
    const summary = {
      collection_start: new Date(this.startTime).toISOString(),
      collection_end: new Date().toISOString(),
      total_operations: this.evidenceLog.length,
      successful_operations: this.evidenceLog.filter(e => e.success).length,
      failed_operations: this.evidenceLog.filter(e => !e.success).length,
      evidence_by_tool: {},
      evidence_by_type: {},
      confidence_distribution: {},
      unique_tests: [...new Set(this.evidenceLog.map(e => e.test_id))].length,
      average_operation_time: Math.round(
        this.evidenceLog.reduce((sum, e) => sum + e.execution_time_ms, 0) / this.evidenceLog.length
      )
    };
    
    // Group by MCP tool
    this.evidenceLog.forEach(entry => {
      if (!summary.evidence_by_tool[entry.mcp_tool]) {
        summary.evidence_by_tool[entry.mcp_tool] = { total: 0, successful: 0, failed: 0 };
      }
      summary.evidence_by_tool[entry.mcp_tool].total++;
      if (entry.success) {
        summary.evidence_by_tool[entry.mcp_tool].successful++;
      } else {
        summary.evidence_by_tool[entry.mcp_tool].failed++;
      }
    });
    
    // Group by evidence type
    this.evidenceLog.forEach(entry => {
      if (!summary.evidence_by_type[entry.evidence_type]) {
        summary.evidence_by_type[entry.evidence_type] = { total: 0, successful: 0, failed: 0 };
      }
      summary.evidence_by_type[entry.evidence_type].total++;
      if (entry.success) {
        summary.evidence_by_type[entry.evidence_type].successful++;
      } else {
        summary.evidence_by_type[entry.evidence_type].failed++;
      }
    });
    
    // Confidence distribution
    this.evidenceLog.forEach(entry => {
      if (!summary.confidence_distribution[entry.confidence_level]) {
        summary.confidence_distribution[entry.confidence_level] = 0;
      }
      summary.confidence_distribution[entry.confidence_level]++;
    });
    
    return summary;
  }

  // Save comprehensive evidence report
  async saveEvidenceReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mcp-evidence-report-${timestamp}.json`;
    const filepath = path.join(this.evidenceDir, filename);
    
    const summary = this.generateEvidenceSummary();
    
    const report = {
      evidence_report_id: `evidence_${timestamp}`,
      metadata: {
        collector_version: '1.0',
        collection_method: 'live_mcp_integration',
        evidence_standard: 'production_grade',
        validation_level: 'comprehensive'
      },
      summary: summary,
      detailed_evidence: this.evidenceLog,
      validation_results: this.validateAllTests(),
      quality_metrics: this.calculateQualityMetrics(),
      recommendations: this.generateRecommendations()
    };
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Evidence report saved: ${filename}`);
    return filepath;
  }

  // Validate evidence for all tests
  validateAllTests() {
    const uniqueTests = [...new Set(this.evidenceLog.map(e => e.test_id))];
    return uniqueTests.map(testId => this.validateEndToEndEvidence(testId));
  }

  // Calculate evidence quality metrics
  calculateQualityMetrics() {
    const total = this.evidenceLog.length;
    const successful = this.evidenceLog.filter(e => e.success).length;
    const highConfidence = this.evidenceLog.filter(e => e.confidence_level === 'high').length;
    
    return {
      success_rate: Math.round((successful / total) * 100),
      confidence_score: Math.round((highConfidence / total) * 100),
      evidence_density: Math.round(total / this.generateEvidenceSummary().unique_tests),
      automation_coverage: {
        webhook_automation: this.evidenceLog.some(e => e.mcp_tool === 'mcp_n8n_n8n_trigger_webhook_workflow'),
        execution_monitoring: this.evidenceLog.some(e => e.mcp_tool === 'mcp_n8n_n8n_get_execution'),
        airtable_verification: this.evidenceLog.some(e => e.mcp_tool === 'mcp_airtable_search_records')
      }
    };
  }

  // Generate recommendations based on evidence
  generateRecommendations() {
    const metrics = this.calculateQualityMetrics();
    const recommendations = [];
    
    if (metrics.success_rate < 85) {
      recommendations.push({
        priority: 'high',
        category: 'reliability',
        issue: `Low success rate: ${metrics.success_rate}%`,
        recommendation: 'Investigate failed MCP operations and implement retry logic'
      });
    }
    
    if (metrics.confidence_score < 70) {
      recommendations.push({
        priority: 'medium',
        category: 'evidence_quality',
        issue: `Low confidence score: ${metrics.confidence_score}%`,
        recommendation: 'Enhance evidence validation and add more verification points'
      });
    }
    
    if (!metrics.automation_coverage.webhook_automation) {
      recommendations.push({
        priority: 'critical',
        category: 'automation_gap',
        issue: 'Webhook automation not verified',
        recommendation: 'Implement and test webhook automation via MCP tools'
      });
    }
    
    if (metrics.evidence_density < 3) {
      recommendations.push({
        priority: 'low',
        category: 'evidence_coverage',
        issue: `Low evidence density: ${metrics.evidence_density} operations per test`,
        recommendation: 'Consider adding more evidence collection points for thorough validation'
      });
    }
    
    return recommendations;
  }

  // Display evidence summary in console
  displayEvidenceSummary() {
    const summary = this.generateEvidenceSummary();
    const metrics = this.calculateQualityMetrics();
    
    console.log(`\n${'📊'.repeat(20)}`);
    console.log(`📊 MCP EVIDENCE SUMMARY`);
    console.log(`${'📊'.repeat(20)}`);
    
    console.log(`\n🔍 COLLECTION STATS:`);
    console.log(`- Total Operations: ${summary.total_operations}`);
    console.log(`- Successful: ✅ ${summary.successful_operations}`);
    console.log(`- Failed: ❌ ${summary.failed_operations}`);
    console.log(`- Success Rate: ${metrics.success_rate}%`);
    console.log(`- Tests Covered: ${summary.unique_tests}`);
    
    console.log(`\n🤖 MCP TOOL USAGE:`);
    Object.entries(summary.evidence_by_tool).forEach(([tool, stats]) => {
      console.log(`- ${tool}: ${stats.successful}/${stats.total} (${Math.round((stats.successful/stats.total)*100)}%)`);
    });
    
    console.log(`\n📋 EVIDENCE TYPES:`);
    Object.entries(summary.evidence_by_type).forEach(([type, stats]) => {
      console.log(`- ${type}: ${stats.successful}/${stats.total} (${Math.round((stats.successful/stats.total)*100)}%)`);
    });
    
    console.log(`\n🎯 QUALITY METRICS:`);
    console.log(`- Confidence Score: ${metrics.confidence_score}%`);
    console.log(`- Evidence Density: ${metrics.evidence_density} ops/test`);
    console.log(`- Automation Coverage: ${Object.values(metrics.automation_coverage).every(Boolean) ? '✅ COMPLETE' : '⚠️ PARTIAL'}`);
    
    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      recommendations.forEach(rec => {
        console.log(`- [${rec.priority.toUpperCase()}] ${rec.recommendation}`);
      });
    }
  }
}

module.exports = MCPEvidenceCollector;