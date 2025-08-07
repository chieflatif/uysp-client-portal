# SESSION 2: PDL COMPANY QUALIFICATION
**TYPE**: Development Session Documentation  
**RESPONSIBILITY**: Development Team  
**PREREQUISITES**: SESSION-1 baseline (ID: THLrjTC7v6LiXZnV) working  
**DURATION**: 2-3 days  
**COST IMPACT**: $0.01 per company lookup call  
**NEXT SESSION**: Session 3 (PDL Person Qualification)

## 🎯 **SESSION OBJECTIVES**

### **PRIMARY GOAL**: Integrate PDL Company API for B2B tech company qualification

### **SUCCESS CRITERIA**:
✅ **Company Qualification**: API call returns company type, size, industry data  
✅ **Cost Control**: API calls limited and monitored (budget tracking)  
✅ **Data Enhancement**: Company data enriched in Airtable with PDL results  
✅ **Error Handling**: Failed API calls gracefully handled without breaking flow  
✅ **Testing**: Reality-based testing with actual company names from Kajabi forms  

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **INTEGRATION POINT**: After Smart Field Mapper (Pattern 00), Before Person Lookup

### **PDL COMPANY API SPECIFICATIONS**:
- **Endpoint**: `https://api.peopledatalabs.com/v5/company/enrich`
- **Cost**: $0.01 per API call
- **Rate Limits**: 100 requests/minute (standard plan)
- **Required Fields**: `name` (company name from form)
- **Optional Enhancement**: `website`, `location` for better matching

### **WORKFLOW SEQUENCE ENHANCEMENT**:
```
SESSION-1 Flow → Company PDL Lookup → Enhanced Airtable Storage
```

**NEW NODES TO ADD**:
1. **Company Name Validator**: Ensure clean company name for API call
2. **PDL Company API Call**: HTTP request to PDL with proper authentication  
3. **Response Parser**: Extract relevant company data from PDL response
4. **Cost Tracker**: Log API call cost and running total
5. **Enhanced Airtable Update**: Store original + PDL enriched company data

---

## 📊 **DATA FLOW & FIELDS**

### **INPUT** (from SESSION-1):
- **Normalized Company Name**: Clean company name from Smart Field Mapper
- **Company Website**: Optional enhancement for better PDL matching
- **Lead Email Domain**: Can help verify company association

### **PDL COMPANY API RESPONSE FIELDS**:
- **Company Type**: Public, Private, Non-profit, Government
- **Industry**: NAICS/SIC industry classification  
- **Employee Count**: Company size ranges
- **Technology Stack**: Technologies used by company
- **Funding Status**: Investment rounds, valuation data
- **Company Description**: Business description and focus areas

### **AIRTABLE STORAGE ENHANCEMENT**:
- **Original Fields**: Maintain existing SESSION-1 data structure
- **PDL Company Data**: New table section for enriched company information
- **Qualification Score**: Initial B2B tech company scoring (0-100)
- **API Metadata**: PDL call status, cost, timestamp, confidence score

---

## 🧪 **TESTING STRATEGY**

### **REALITY-BASED TEST CASES**:
1. **Known B2B Tech Companies**: Test with Salesforce, HubSpot, Microsoft submissions
2. **Non-Tech Companies**: Test with retail, restaurant, service companies  
3. **Small Companies**: Test with local businesses and startups
4. **Invalid Companies**: Test with fake or misspelled company names
5. **API Failures**: Test with rate limit hits and network failures

### **SUCCESS METRICS**:
- **API Success Rate**: >95% successful calls for valid company names
- **Data Quality**: >90% relevant enrichment data received
- **Cost Control**: API costs tracked within $5/day limit initially
- **Integration Stability**: No disruption to existing SESSION-1 flow

---

## 🛠️ **IMPLEMENTATION PROTOCOL**

### **PHASE 2A: PDL COMPANY API INTEGRATION**

#### **CHUNK 1**: PDL API Authentication & Basic Connection
- **Setup**: PDL API key configuration in n8n environment
- **Test**: Basic API connectivity with simple company lookup
- **Evidence**: Successful API response with sample company data

#### **CHUNK 2**: Company Name Validation & API Call Logic  
- **Enhancement**: Add company name cleaning and validation
- **Integration**: Insert PDL API call after Pattern 00 field normalization
- **Evidence**: API calls working with normalized company names

#### **CHUNK 3**: Response Processing & Data Storage
- **Parser**: Extract and structure PDL company response data
- **Storage**: Enhanced Airtable fields for PDL company information  
- **Evidence**: Enriched company data visible in Airtable records

#### **CHUNK 4**: Cost Tracking & Monitoring
- **Tracking**: API call cost monitoring and budget controls
- **Alerts**: Cost threshold warnings and usage reporting
- **Evidence**: Cost tracking data and budget compliance

#### **CHUNK 5**: Error Handling & Testing
- **Resilience**: Graceful handling of API failures and rate limits
- **Testing**: Reality-based testing with actual form submissions
- **Evidence**: Test results with various company types and edge cases

---

## 📋 **DELIVERABLES**

### **TECHNICAL DELIVERABLES**:
1. **Enhanced n8n Workflow**: SESSION-1 + PDL Company API integration
2. **Airtable Schema Update**: New fields for PDL company data
3. **Cost Tracking System**: API usage monitoring and budget controls
4. **Error Handling Logic**: Graceful API failure management

### **DOCUMENTATION DELIVERABLES**:
1. **Updated Pattern 07**: PDL Company API integration patterns
2. **Testing Evidence**: Reality-based test results and success metrics
3. **API Documentation**: PDL Company API usage and response handling
4. **Cost Analysis**: API usage costs and budget recommendations

---

## 🔄 **SESSION COORDINATION**

### **DEVELOPER AGENT HANDOFF**:
- **Context Package**: SESSION-1 baseline + PDL Company specifications
- **Tool Requirements**: Context7 + N8N MCP + PDL API key access
- **Evidence Standards**: API responses, cost data, Airtable record IDs
- **Validation Protocol**: Pattern 00 compliance + PDL data quality checks

### **COMPLETION CRITERIA**:
✅ **Working Integration**: PDL Company API calls integrated into SESSION-1 flow  
✅ **Data Quality**: Company enrichment data stored in Airtable  
✅ **Cost Control**: API usage tracked and within budget limits  
✅ **Testing Complete**: Reality-based testing passed with evidence  
✅ **Documentation Updated**: All patterns and guides reflect PDL integration  

### **HANDOFF TO SESSION 3**:
- **Foundation**: SESSION-1 + SESSION-2 (Company qualification working)
- **Next Focus**: PDL Person API integration for sales role verification
- **Data Available**: Enriched company data for person qualification context

---

**SESSION 2 STATUS**: ⏸️ **READY FOR DEVELOPMENT**  
**PREREQUISITE**: SESSION-1 (ID: THLrjTC7v6LiXZnV) confirmed working  
**ESTIMATED DURATION**: 2-3 development days with testing and documentation