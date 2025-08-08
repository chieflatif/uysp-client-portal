# 🎨 Project Customization Guide
## **UYSP Framework Adaptation for New Projects**

**Framework Version**: Production-Ready  
**Source**: UYSP Lead Qualification V1  
**Purpose**: Systematic customization for new project architectures  

---

## 🎯 **Customization Overview**

The UYSP framework can be adapted for various n8n/cloud automation projects:

### **Supported Project Types**
- ✅ **CRM Integration Systems** (lead processing, data enrichment)
- ✅ **E-commerce Automation** (order processing, customer workflows)  
- ✅ **Data Processing Pipelines** (ETL, validation, enrichment)
- ✅ **Notification Systems** (SMS, email, webhook routing)
- ✅ **API Integration Hubs** (multi-service coordination)

### **Core Adaptations Required**
1. **Service Configuration** - Update IDs and endpoints
2. **Field Patterns** - Adapt pattern 00 for your data structure
3. **Testing Categories** - Modify test framework for your use case
4. **Documentation** - Update project references and guides

---

## 📋 **Step-by-Step Customization**

### **STEP 1: Project Configuration**

Create your project config file:

```json
{
  "projectName": "CRM Integration Hub",
  "projectDescription": "Multi-CRM data synchronization and lead routing",
  "projectSlug": "crm-hub",
  "services": {
    "n8n": {
      "workflowId": "NEW_WORKFLOW_ID_HERE",
      "workflowName": "crm-hub-main-workflow",
      "webhookPath": "crm-webhook"
    },
    "airtable": {
      "baseId": "NEW_AIRTABLE_BASE_ID",
      "keyTables": ["Leads", "Companies", "Activities"]
    },
    "primaryDataFlow": "CRM → Field Normalization → Deduplication → Routing"
  },
  "customization": {
    "fieldMappings": {
      "primaryEntity": "leads",
      "keyFields": ["email", "company", "source_crm"],
      "enrichmentFields": ["industry", "company_size", "revenue"]
    },
    "testingFocus": ["field_mapping", "crm_integration", "deduplication"]
  }
}
```

### **STEP 2: Field Pattern Adaptation**

Customize Pattern 00 (Field Normalization) for your data structure:

#### **Original UYSP Pattern 00 (Lead Qualification)**
```javascript
// Core field mappings - UYSP Lead Qualification
const fieldMappings = {
  email: ['email', 'Email', 'EMAIL', 'email_address'],
  phone: ['phone', 'Phone', 'PHONE', 'phone_number'],
  company: ['company', 'Company', 'company_name'],
  // ... lead-specific fields
};
```

#### **Adapted Pattern 00 (CRM Integration Example)**
```javascript
// Core field mappings - CRM Integration Hub
const fieldMappings = {
  email: ['email', 'Email', 'contact_email', 'primary_email'],
  company: ['company', 'account_name', 'organization', 'company_name'],
  contact_id: ['id', 'contact_id', 'crm_id', 'external_id'],
  source_crm: ['source', 'crm_source', 'origin_system'],
  revenue: ['revenue', 'annual_revenue', 'arr', 'company_revenue'],
  // ... CRM-specific fields
};
```

### **STEP 3: Testing Framework Adaptation**

Modify test categories for your use case:

#### **Original UYSP Categories**
1. **Field Variations** (FV) - Lead form field handling
2. **Boolean Conversions** (BC) - Coaching interest flags  
3. **Edge Cases** (EC) - International leads
4. **Duplicate Handling** (DH) - Email-based deduplication
5. **Compliance Tests** (CT) - SMS/TCPA compliance

#### **CRM Integration Example Categories**
1. **Field Variations** (FV) - Multi-CRM field mapping
2. **ID Resolution** (IR) - Cross-CRM contact matching
3. **Data Validation** (DV) - CRM data quality checks
4. **Sync Conflicts** (SC) - Bidirectional sync handling
5. **Integration Tests** (IT) - End-to-end CRM workflows

### **STEP 4: Service-Specific Customization**

#### **For E-commerce Projects**
```json
{
  "projectName": "E-commerce Order Automation",
  "services": {
    "shopify": {
      "webhookEndpoints": ["orders/create", "orders/paid", "orders/cancelled"],
      "keyFields": ["order_id", "customer_email", "total_price"]
    },
    "fulfillment": {
      "provider": "shipstation",
      "integrationFields": ["tracking_number", "shipping_status"]
    }
  },
  "patterns": {
    "00": "order-field-normalization",
    "01": "inventory-tracking", 
    "02": "customer-segmentation"
  }
}
```

#### **For Data Pipeline Projects**
```json
{
  "projectName": "Marketing Data Pipeline",
  "services": {
    "sources": ["hubspot", "salesforce", "marketo"],
    "destinations": ["warehouse", "analytics", "reporting"],
    "transformations": ["deduplication", "enrichment", "scoring"]
  },
  "patterns": {
    "00": "multi-source-field-normalization",
    "01": "data-quality-validation",
    "02": "pipeline-error-handling"
  }
}
```

### **STEP 5: Documentation Customization**

Update key documentation files:

#### **README.md Updates**
```markdown
# {{PROJECT_NAME}} Development Framework

**Based on**: UYSP Lead Qualification Framework  
**Use Case**: {{PROJECT_DESCRIPTION}}  
**Primary Data Flow**: {{PRIMARY_DATA_FLOW}}

## Quick Start
\`\`\`bash
npm run start-work
npm run branch new {{feature-name}} 'Description'
\`\`\`

## Service Configuration
- **Primary Workflow**: {{N8N_WORKFLOW_ID}}
- **Database**: {{AIRTABLE_BASE_ID}}
- **Key Endpoints**: {{WEBHOOK_ENDPOINTS}}
```

#### **Pattern Documentation Updates**
- Update pattern descriptions for your domain
- Modify field mapping examples  
- Adapt testing scenarios
- Update business logic explanations

---

## 🛠️ **Advanced Customization**

### **Multi-Service Integration**

For projects with >2 cloud services:

```javascript
// Enhanced service configuration
const serviceConfig = {
  primary: "n8n",
  databases: ["airtable", "supabase"],
  apis: ["stripe", "twilio", "sendgrid"],
  webhooks: ["shopify", "hubspot", "typeform"]
};

// Update backup scripts for multiple services
// Update MCP tool configurations
// Add service-specific patterns
```

### **Industry-Specific Adaptations**

#### **Healthcare/HIPAA Compliance**
- Add encrypted field handling patterns
- Implement audit trail requirements
- Update testing for compliance scenarios
- Add data retention policies

#### **Financial/SOX Compliance**  
- Add transaction verification patterns
- Implement approval workflow patterns
- Update testing for audit requirements
- Add regulatory reporting patterns

#### **Real Estate/Lead Management**
- Add property-specific field patterns
- Implement lead scoring adaptations
- Update testing for market-specific scenarios
- Add geographic routing patterns

---

## 📊 **Validation Checklist**

### **Framework Adaptation Validation**

- [ ] **Service IDs Updated**: All workflow/base IDs match new project
- [ ] **Field Patterns Adapted**: Pattern 00 reflects new data structure  
- [ ] **Testing Categories Modified**: Test framework covers new use cases
- [ ] **Documentation Updated**: All UYSP references changed to new project
- [ ] **npm Scripts Functional**: All automation commands work correctly
- [ ] **MCP Tools Configured**: Tool specifications match new services
- [ ] **Backup System Operational**: Real exports produce valid JSON files
- [ ] **Agent Context Updated**: 3-agent system reflects new project scope

### **Project-Specific Validation**

- [ ] **End-to-End Flow Tested**: Primary workflow processes test data correctly
- [ ] **Error Handling Verified**: Edge cases handled gracefully  
- [ ] **Performance Validated**: System handles expected data volumes
- [ ] **Security Reviewed**: Access controls and data protection appropriate
- [ ] **Documentation Complete**: Team can follow setup and operation guides

---

## 🎯 **Common Customization Patterns**

### **Pattern A: Lead Processing → Order Processing**
```javascript
// Original: Lead qualification
if (qualified) → SMS campaign
// Adapted: Order validation  
if (validated) → Fulfillment workflow
```

### **Pattern B: Single Source → Multi-Source**
```javascript
// Original: Kajabi webhooks only
webhook → normalization → airtable
// Adapted: Multiple webhook sources
[webhook1, webhook2, webhook3] → unified_normalization → routing
```

### **Pattern C: Compliance → Industry Standards**
```javascript
// Original: SMS/TCPA compliance
compliance_check → send_sms
// Adapted: HIPAA compliance
hipaa_validation → secure_storage → audit_log
```

---

## 🚀 **Framework Evolution**

As your project grows, the framework can evolve:

### **Phase 1: Basic Adaptation** (Week 1-2)
- Service configuration
- Field pattern adaptation  
- Basic testing setup

### **Phase 2: Advanced Integration** (Week 3-4)
- Multi-service orchestration
- Advanced testing scenarios
- Performance optimization

### **Phase 3: Production Enhancement** (Month 2+)
- Industry-specific compliance
- Advanced monitoring
- Team collaboration tools

---

## 📞 **Customization Support**

### **Self-Service Resources**
1. **Universal Guide**: `docs/UNIVERSAL-CURSOR-WORKFLOW-SYSTEM.md`
2. **MCP Tool Specs**: `docs/MCP-TOOL-SPECIFICATIONS-COMPLETE.md`  
3. **Pattern Library**: `patterns/` directory
4. **Testing Examples**: `tests/` directory

### **Validation Tools**
1. **Framework Validator**: `scripts/framework-validate.sh`
2. **Import Automation**: `scripts/framework-import.sh`
3. **Export System**: `scripts/framework-export.sh`

### **Success Metrics**
- ✅ Framework deploys in <1 hour
- ✅ Primary workflow functional within 1 day
- ✅ Full testing suite operational within 1 week
- ✅ Team productive with framework within 2 weeks

**Customization Confidence**: 90% - Systematic approach with proven patterns and comprehensive validation