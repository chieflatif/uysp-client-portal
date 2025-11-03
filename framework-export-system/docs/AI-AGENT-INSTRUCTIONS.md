# AI AGENT INSTRUCTIONS - UYSP Framework Customization

## **🎯 YOUR MISSION**

You are an AI agent in a NEW project that has imported the UYSP Development Framework. Your task is to **analyze the project's documentation and intelligently customize the framework** to match the specific requirements.

## **📋 WORKFLOW OVERVIEW**

### **STEP 1: DOCUMENT ANALYSIS**
Analyze project documents provided by the user:
- **Product Requirements Document** (requirements, features, scope)
- **Architecture Blueprint** (technical design, system components)
- **Development Plan** (timeline, phases, priorities)
- **Business Logic** (workflows, decision points, integrations)

### **STEP 2: INTELLIGENT CUSTOMIZATION**
Based on your analysis, customize these framework components:
- **Workflow Templates** (n8n node configurations)
- **Data Schema** (Airtable table structures)
- **Testing Patterns** (test cases specific to project needs)
- **Documentation** (project-specific guides)
- **Agent Context** (PM/Testing/Developer agent specializations)

### **STEP 3: VALIDATION**
Verify customizations align with:
- **Requirements completeness**
- **Architecture compliance**
- **Technical feasibility**
- **UYSP framework compatibility**

---

## **🔍 DOCUMENT ANALYSIS FRAMEWORK**

### **REQUIREMENTS ANALYSIS CHECKLIST**
When analyzing project documents, extract:

#### **📊 Data & Integration Requirements**
- [ ] **Primary Data Entities**: What are the main data objects? (leads, customers, orders, etc.)
- [ ] **Data Sources**: Where does data come from? (webhooks, APIs, forms, imports)
- [ ] **Data Destinations**: Where does data go? (CRM, database, notifications, analytics)
- [ ] **Integration Points**: What external systems connect? (Salesforce, HubSpot, Stripe, etc.)
- [ ] **Data Transformations**: What processing is needed? (validation, enrichment, scoring)

#### **🔄 Workflow Requirements**
- [ ] **Business Processes**: What are the main workflows? (lead qualification, order processing, etc.)
- [ ] **Decision Points**: What conditional logic is needed? (if/then rules, scoring thresholds)
- [ ] **Automation Triggers**: What events start processes? (form submissions, status changes, schedules)
- [ ] **Human Touchpoints**: Where do humans intervene? (approvals, reviews, manual data entry)
- [ ] **Error Handling**: How are failures managed? (retries, alerts, fallbacks)

#### **⚡ Performance Requirements**
- [ ] **Volume Expectations**: How much data? (records per day/hour, file sizes)
- [ ] **Speed Requirements**: How fast must it be? (real-time, batch, scheduled)
- [ ] **Reliability Needs**: What uptime is required? (24/7, business hours, acceptable downtime)
- [ ] **Scalability Plans**: How will it grow? (user growth, data growth, feature expansion)

#### **🛡️ Compliance & Security**
- [ ] **Data Protection**: What privacy rules apply? (GDPR, CCPA, HIPAA)
- [ ] **Access Controls**: Who can access what? (role-based permissions, approval workflows)
- [ ] **Audit Requirements**: What tracking is needed? (change logs, access logs, data lineage)
- [ ] **Backup & Recovery**: What are the recovery needs? (RTO, RPO, backup frequency)

---

## **🔧 CUSTOMIZATION GUIDELINES**

### **WORKFLOW CUSTOMIZATION**
Based on your analysis, customize the n8n workflow:

#### **Field Normalization (MANDATORY)**
```javascript
// ALWAYS start with Smart Field Mapper - adapt for your project
const projectFields = {
  // Map your project's field variations
  primaryKey: ['id', 'ID', 'record_id', 'unique_id'],
  email: ['email', 'Email', 'EMAIL', 'email_address'],
  name: ['name', 'Name', 'full_name', 'customer_name'],
  // Add project-specific fields
  projectSpecific: ['custom_field_1', 'priority', 'source']
};
```

#### **Business Logic Nodes**
Customize these node types based on requirements:
- **Conditional Logic**: Implement your decision trees
- **Data Enrichment**: Add project-specific data enhancement
- **Integrations**: Configure your external system connections
- **Notifications**: Set up project-specific alerts

### **DATABASE CUSTOMIZATION**
Adapt Airtable schema to your project:

#### **Table Structure**
```json
{
  "primaryTable": {
    "name": "YourMainEntity", // e.g., "Customers", "Orders", "Leads"
    "fields": [
      // Core fields (always include)
      {"name": "Email", "type": "email"},
      {"name": "Created", "type": "createdTime"},
      {"name": "Modified", "type": "lastModifiedTime"},
      // Project-specific fields
      {"name": "YourCustomField", "type": "singleLineText"}
    ]
  },
  "lookupTables": [
    // Add tables for your specific data relationships
  ]
}
```

### **TESTING CUSTOMIZATION**
Create project-specific test scenarios:

#### **Test Categories to Adapt**
- **Data Validation Tests**: Based on your field requirements
- **Integration Tests**: For your specific external systems
- **Business Logic Tests**: For your decision trees and workflows
- **Edge Case Tests**: For your specific data variations
- **Performance Tests**: Based on your volume expectations

### **DOCUMENTATION CUSTOMIZATION**
Adapt these documents for your project:
- **README.md**: Project-specific setup instructions
- **Architecture Guide**: Your system design
- **User Guide**: Your specific workflows
- **Troubleshooting**: Your common issues and solutions

---

## **🎛️ CUSTOMIZATION EXECUTION PROTOCOL**

### **PHASE 1: ANALYSIS & PLANNING**
1. **Read all project documents** provided by user
2. **Extract requirements** using the checklist above
3. **Create customization plan** with specific adaptations needed
4. **Present plan to user** for approval before proceeding

### **PHASE 2: FRAMEWORK ADAPTATION**
1. **Start with field normalization** - adapt Smart Field Mapper for your data
2. **Customize workflow logic** - implement your business processes
3. **Adapt database schema** - modify tables for your data model
4. **Configure integrations** - set up your external system connections
5. **Update documentation** - create project-specific guides

### **PHASE 3: VALIDATION & TESTING**
1. **Run framework validation** using provided tools
2. **Test with sample data** based on your requirements
3. **Verify integrations** work with your external systems
4. **Validate against requirements** ensure all needs are met
5. **Create project-specific test suite** for ongoing validation

### **PHASE 4: DEPLOYMENT PREPARATION**
1. **Generate deployment checklist** specific to your project
2. **Create environment setup guide** for your stack
3. **Document maintenance procedures** for your customized system
4. **Prepare handover materials** for your development team

---

## **🚨 CRITICAL REQUIREMENTS**

### **MUST PRESERVE**
- ✅ **Field Normalization Pattern**: Always use Smart Field Mapper as first node
- ✅ **Anti-Hallucination Protocols**: Keep confidence scoring and evidence requirements
- ✅ **3-Agent System**: Maintain PM/Testing/Developer separation
- ✅ **MCP Tool Integration**: Preserve n8n and Airtable MCP tool usage
- ✅ **Platform Gotcha Prevention**: Keep known issue prevention patterns

### **MUST CUSTOMIZE**
- 🎯 **Data Schema**: Adapt to your specific entities and relationships
- 🎯 **Business Logic**: Implement your specific processes and rules
- 🎯 **Integration Points**: Configure for your external systems
- 🎯 **Test Scenarios**: Create tests for your specific use cases
- 🎯 **Documentation**: Write guides specific to your project

### **MUST VALIDATE**
- ✅ **Requirements Coverage**: Every requirement addressed
- ✅ **Technical Feasibility**: All customizations are implementable
- ✅ **Framework Compatibility**: Customizations don't break core patterns
- ✅ **Performance Viability**: System can handle expected volumes
- ✅ **Maintenance Sustainability**: Team can maintain customized system

---

## **📖 EXAMPLES OF GOOD CUSTOMIZATION**

### **Example 1: E-commerce Order Processing**
**Requirements**: "Process orders from Shopify, validate inventory, charge payment, send notifications"

**Customization**:
- **Field Mapper**: Map Shopify order fields to normalized schema
- **Business Logic**: Add inventory check, payment processing, notification nodes
- **Database**: Create Orders, Products, Customers tables
- **Tests**: Test with various order scenarios, payment failures, inventory shortages

### **Example 2: CRM Lead Qualification**
**Requirements**: "Qualify leads from multiple sources, score based on criteria, route to sales"

**Customization**:
- **Field Mapper**: Normalize lead data from forms, APIs, imports
- **Business Logic**: Implement scoring algorithm, routing rules
- **Database**: Create Leads, Companies, Activities tables
- **Tests**: Test scoring accuracy, routing logic, duplicate handling

### **Example 3: Content Moderation Pipeline**
**Requirements**: "Review user-generated content, auto-moderate, escalate to humans"

**Customization**:
- **Field Mapper**: Normalize content submissions
- **Business Logic**: Add AI moderation, escalation rules, human review queue
- **Database**: Create Content, Reviews, Moderators tables
- **Tests**: Test moderation accuracy, escalation triggers, review workflows

---

## **✅ SUCCESS CRITERIA**

Your customization is successful when:

1. **✅ Analysis Complete**: All project documents analyzed and requirements extracted
2. **✅ Framework Adapted**: UYSP framework customized to project needs
3. **✅ Requirements Met**: All specified requirements addressable with customized system
4. **✅ Tests Pass**: Validation confirms customizations work as intended
5. **✅ Documentation Updated**: Project-specific guides created
6. **✅ Deployment Ready**: System ready for development team handover

**Remember**: Your role is to be the intelligent bridge between generic framework and specific project needs. Use the UYSP framework's proven patterns while adapting them to the unique requirements of the new project.

**Confidence Target**: Aim for 90%+ confidence in all customizations with evidence-based validation.