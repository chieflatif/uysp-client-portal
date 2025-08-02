# PDL MASTER ARCHITECTURE
**TYPE**: Primary Authoritative Architecture  
**RESPONSIBILITY**: Development Team  
**UPDATE FREQUENCY**: Major system changes  
**LAST UPDATED**: August 1, 2025  
**NEXT REVIEW**: After PRE COMPLIANCE → PDL migration completion  
**CROSS-REFERENCES**: Pattern 00, 07; PRE COMPLIANCE baseline (ID: wpg9K9s8wlfofv1u); testing-registry-master.md

## INTEGRATION REQUIREMENTS
- **Patterns Required**: Pattern 00 (mandatory first), Pattern 07 (PDL integration)
- **Session Protocols**: Session-based development with ≤5 operations per chunk
- **Tool Requirements**: Context7 + N8N MCP tools mandatory for all n8n operations
- **Evidence Standards**: Execution IDs, record IDs, API responses, cost tracking

---

## 🎯 **PDL SYSTEM OVERVIEW**

### **ARCHITECTURAL FOUNDATION**
**Base System**: PRE COMPLIANCE (ID: wpg9K9s8wlfofv1u) - Evidence-based chosen baseline  
**Enhancement**: Add PDL qualification layers while preserving existing functionality  
**Flow**: Kajabi → Field Normalization → PDL Qualification → ICP Scoring → SMS Campaign

### **PDL INTEGRATION POINTS**
1. **Company Qualification**: PDL Company API ($0.01/call) after field normalization
2. **Person Enrichment**: PDL Person API ($0.03/call) after company passes  
3. **ICP Scoring**: Claude AI (0-100 scale) combining company + person data
4. **SMS Campaign**: SimpleTexting direct for qualified leads (ICP ≥70, US only)

---

## 🏗️ **SYSTEM ARCHITECTURE**

### **PRE COMPLIANCE BASELINE PRESERVATION** 
**Components to Maintain**:
- Webhook reception (kajabi-leads endpoint)
- Smart Field Mapper (3-field phone strategy)
- Duplicate detection (email-based)
- Airtable create/update operations
- Platform gotcha prevention protocols

**Integration Strategy**: Insert PDL components between field normalization and final Airtable operations

### **PDL QUALIFICATION PIPELINE**

#### **Phase 1: Company Qualification**
```
Input: Normalized company name from Smart Field Mapper
API: PDL Company API
Cost: $0.01 per call
Output: B2B tech company status + firmographic data
Routing: Pass → Person lookup | Fail → Archive with reason
```

#### **Phase 2: Person Enrichment**  
```
Input: Normalized email + company qualification data
API: PDL Person API  
Cost: $0.03 per call
Output: Sales role verification + contact enrichment
Routing: Pass → ICP scoring | Fail → Human review queue
```

#### **Phase 3: ICP Scoring**
```
Input: Combined company + person qualification data
Service: Claude AI integration
Scoring: 0-100 scale based on ICP criteria
Threshold: ≥70 required for SMS campaign eligibility
Routing: ≥70 → SMS | 50-69 → Archive | <50 → Archive
```

#### **Phase 4: SMS Campaign Delivery**
```
Input: Qualified leads (ICP ≥70) with US phone numbers
Service: SimpleTexting direct API
Filter: phone_country_code = "+1" (US leads only)
International: Route to human review regardless of score
Compliance: Service handles DND/TCPA (no custom logic)
```

---

## 💰 **COST CONTROL ARCHITECTURE**

### **API Cost Structure**
- **PDL Company API**: $0.01 per qualification call
- **PDL Person API**: $0.03 per enrichment call  
- **SMS Service**: Variable per message sent
- **Daily Limit**: $50 circuit breaker (existing system)

### **Cost Tracking Integration**
- **Daily_Costs Table**: Enhanced for PDL API tracking
- **Budget Monitoring**: Real-time cost accumulation  
- **Circuit Breaker**: Workflow pause at daily limit
- **Cost Recovery**: Automatic resumption next day

---

## 🔄 **WORKFLOW INTEGRATION**

### **Enhanced Workflow Components**
1. **Webhook** (existing) → **Field Normalization** (existing)
2. **PDL Company Qualification** (new) → **Cost Tracking** (enhanced)  
3. **PDL Person Enrichment** (new) → **Data Mapping** (enhanced)
4. **ICP Scoring** (new) → **Threshold Routing** (new)
5. **SMS Integration** (new) → **Response Tracking** (new)
6. **Airtable Operations** (existing) → **Evidence Collection** (enhanced)

### **Data Flow Architecture**
```
Kajabi Form → Field Normalization → Duplicate Check → 
Company API → Person API → ICP Score → Routing Decision →
SMS (≥70, US) | Archive (<70) | Human Review (International)
```

---

## 📊 **EVIDENCE & VALIDATION**

### **Evidence Requirements**
- **API Responses**: PDL Company + Person API response IDs
- **Execution IDs**: n8n workflow success confirmation  
- **Record IDs**: Airtable record creation/update verification
- **Cost Tracking**: Daily_Costs table accurate entries

### **Quality Gates**
1. **Component Level**: Individual API and scoring validation
2. **Integration Level**: End-to-end flow verification
3. **Performance Level**: Cost and timing metrics
4. **Business Level**: ICP score accuracy and SMS delivery rates

---

## 🛠️ **DEVELOPMENT PROTOCOLS**

### **Phase-Based Development (PRE COMPLIANCE Foundation)**
- **Phase 1**: PDL Company API integration on PRE COMPLIANCE baseline
- **Phase 2**: PDL Person API integration with Smart Field Mapper v4.6
- **Phase 3**: ICP scoring system enhancement
- **Phase 4**: SMS service integration with SimpleTexting

### **MCP Tool Requirements (Updated Specifications)**
- **Context7 HTTP**: https://context7.liam.sh/mcp with resolve-library-id, get-library-docs for documentation accuracy
- **DocFork**: npx docfork@latest for latest n8n documentation (66.5K tokens, 16-hour updates)
- **Exa Search**: API key f82c9e48-3488-4468-a9b0-afe595d99c30 for implementation research
- **N8N MCP Tools**: 39-tool suite for workflow operations (mcp_n8n_get_workflow, mcp_n8n_validate_workflow)
- **Airtable MCP Tools**: 13-tool suite for database operations (mcp_airtable_get_record, mcp_airtable_list_records)
- **Evidence Collection**: mcp_n8n_n8n_get_execution for all operations
- **Database Verification**: mcp_airtable_get_record for record validation
- **Cost Verification**: Daily_Costs table monitoring

### **Chunking Protocol**
- **Max Operations**: ≤5 operations per development chunk
- **User Confirmation**: Required between chunks
- **Evidence Collection**: Mandatory for each operation
- **Validation**: Tool-verified before proceeding

---

## 🚨 **COMPLIANCE & STANDARDS**

### **Pattern Integration**
- **Pattern 00**: Field normalization mandatory first
- **Pattern 07**: PDL integration protocols (this architecture)  
- **Pattern 06**: Testing and evidence collection
- **Pattern 03**: Updated enrichment specifications

### **Documentation Standards**
- **Authoritative Source**: This document for PDL architecture
- **Cross-References**: All related patterns and sessions
- **Update Protocol**: Major changes require architecture review
- **Evidence Requirements**: All claims tool-verified

---

## 📋 **SUCCESS METRICS**

### **Technical Metrics**
- **API Success Rate**: ≥95% for both Company and Person APIs
- **ICP Accuracy**: Score correlation with business outcomes
- **SMS Delivery**: ≥90% successful delivery rate
- **Cost Efficiency**: Actual vs budgeted API costs

### **Business Metrics**
- **Qualification Rate**: % of leads passing ICP threshold
- **Conversion Rate**: SMS response and engagement rates
- **ROI Tracking**: Cost per qualified lead vs revenue impact
- **Human Review**: % requiring manual intervention

---

**PDL MASTER ARCHITECTURE STATUS**: ✅ **COMPLIANT WITH CONTEXT ENGINEERING**  
**REFORMED FROM**: Incompatible .txt files to proper markdown standards  
**INTEGRATION**: Full alignment with PM protocols and tool requirements

This architecture document provides complete PDL system specifications while maintaining compatibility with established context engineering, session protocols, and evidence requirements.