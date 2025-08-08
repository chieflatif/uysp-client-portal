# SESSION 3: PDL PERSON QUALIFICATION  
**TYPE**: Development Session Documentation  
**RESPONSIBILITY**: Development Team  
**PREREQUISITES**: SESSION-2 (PDL Company) complete  
**DURATION**: 3-4 days  
**COST IMPACT**: $0.03 per person lookup call  
**NEXT SESSION**: Session 4 (ICP Scoring & Lead Qualification)

## 🎯 **SESSION OBJECTIVES**

### **PRIMARY GOAL**: Integrate PDL Person API for sales role verification and professional qualification

### **SUCCESS CRITERIA**:
✅ **Person Qualification**: API returns job title, role, seniority, department data  
✅ **Sales Role Detection**: Identifies sales professionals, decision makers, executives  
✅ **Contact Enhancement**: Phone numbers, LinkedIn profiles, additional contact data  
✅ **Integration Harmony**: Works seamlessly with SESSION-2 company data  
✅ **Cost Optimization**: Intelligent person lookup only for qualified companies  

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **INTEGRATION POINT**: After SESSION-2 Company Qualification, Before ICP Scoring

### **PDL PERSON API SPECIFICATIONS**:
- **Endpoint**: `https://api.peopledatalabs.com/v5/person/enrich`
- **Cost**: $0.03 per API call (3x company cost)  
- **Enhanced Cost**: $0.05 for premium data (phone numbers, detailed profiles)
- **Rate Limits**: 100 requests/minute (standard plan)
- **Required Fields**: `email` + `company` (from Sessions 1-2)
- **Optional Enhancement**: `first_name`, `last_name`, `linkedin_url`

### **WORKFLOW SEQUENCE**:
```
SESSION-2 Flow → Company Qualified? → Person PDL Lookup → Enhanced Lead Scoring
```

**INTELLIGENT LOOKUP LOGIC**:
- **Qualified Companies Only**: Only call PDL Person API for B2B tech companies
- **Cost Control**: Skip person lookup for non-qualified companies  
- **Data Context**: Use company data to enhance person matching accuracy

---

## 📊 **DATA FLOW & ENHANCED QUALIFICATION**

### **INPUT** (from SESSIONS 1-2):
- **Person Email**: Primary identifier for PDL Person API
- **Company Data**: Enhanced context from SESSION-2 for better matching
- **Basic Name Data**: First/last name from original form submission
- **Company Qualification**: B2B tech company status influences person lookup

### **PDL PERSON API RESPONSE FIELDS**:
- **Professional Identity**: Current job title, department, seniority level
- **Role Classification**: Sales, Marketing, Engineering, Executive, etc.
- **Decision Maker Status**: C-level, VP-level, Manager-level indicators
- **Contact Enhancement**: Additional phone numbers, social profiles  
- **Experience Data**: Previous roles, career progression, tenure information
- **Education Background**: Schools, degrees, professional certifications

### **ENHANCED AIRTABLE STORAGE**:
- **Person Qualification Score**: Sales role likelihood (0-100)
- **Decision Maker Level**: Contact authority and purchasing influence
- **Enhanced Contact Data**: Additional phone numbers, LinkedIn profiles
- **Professional Context**: Department, seniority, role responsibilities  
- **API Metadata**: PDL Person call status, cost, confidence scoring

---

## 🎯 **SALES ROLE DETECTION LOGIC**

### **HIGH-VALUE TARGETS** (Priority for qualification):
- **Sales Roles**: Account Executive, Sales Manager, Sales Director, VP Sales
- **Executive Roles**: C-level (CEO, CTO, CMO), VP-level positions  
- **Decision Makers**: Director-level, Department Heads, Purchasing roles
- **Business Development**: BD Manager, Partnership roles, Growth roles

### **QUALIFICATION SCORING ALGORITHM**:
```
PERSON SCORE = (Role Weight × 40) + (Seniority × 30) + (Department × 20) + (Company Fit × 10)

Role Weight:
- Sales roles: 100 points
- Executive roles: 90 points  
- Marketing roles: 70 points
- Technical decision makers: 60 points
- Other roles: 20 points

Seniority Weight:
- C-level: 100 points
- VP-level: 85 points
- Director: 70 points  
- Manager: 50 points
- Individual contributor: 25 points
```

---

## 🧪 **ADVANCED TESTING STRATEGY**

### **ROLE-BASED TEST CASES**:
1. **Sales Professionals**: Test with AE, Sales Manager, Sales Director emails
2. **C-Level Executives**: Test with CEO, CTO, CMO submissions  
3. **Marketing Leaders**: Test with CMO, Marketing Director, Growth roles
4. **Technical Decision Makers**: Test with CTO, Engineering VP, IT Director
5. **Non-Qualified Roles**: Test with individual contributors, non-business roles

### **COMPANY CONTEXT TESTING**:
1. **Qualified + Qualified**: B2B tech company + sales role person
2. **Qualified + Non-Qualified**: B2B tech company + non-sales role
3. **Non-Qualified + Any**: Non-tech company (should skip person lookup)
4. **API Integration**: Test company data enhances person matching accuracy

---

## 🛠️ **IMPLEMENTATION PROTOCOL**

### **PHASE 2B: PDL PERSON API INTEGRATION**

#### **CHUNK 1**: Person API Authentication & Connection
- **Setup**: PDL Person API configuration with enhanced permissions
- **Test**: Basic person lookup with email + company context
- **Evidence**: Successful API response with professional profile data

#### **CHUNK 2**: Intelligent Lookup Logic Integration
- **Conditional Logic**: Only call Person API for qualified companies
- **Cost Optimization**: Skip expensive person calls for non-B2B companies
- **Evidence**: Cost savings demonstrated through selective API usage

#### **CHUNK 3**: Sales Role Detection & Scoring  
- **Algorithm**: Implement role detection and qualification scoring logic
- **Integration**: Enhanced lead scoring based on person + company data
- **Evidence**: Accurate sales role identification and qualification scores

#### **CHUNK 4**: Enhanced Contact Data Management
- **Storage**: Additional contact fields for PDL person enhancement
- **Enrichment**: Phone numbers, social profiles, professional details
- **Evidence**: Enhanced contact data stored and accessible in Airtable

#### **CHUNK 5**: End-to-End Testing & Validation
- **Integration**: Complete SESSION-1 → SESSION-2 → SESSION-3 flow testing
- **Performance**: Cost optimization and data quality validation  
- **Evidence**: Comprehensive test results with real-world scenarios

---

## 📋 **DELIVERABLES**

### **TECHNICAL DELIVERABLES**:
1. **Enhanced Workflow**: SESSION-1-2-3 integrated with person qualification
2. **Qualification Logic**: Sales role detection and lead scoring algorithms  
3. **Cost Controls**: Intelligent API usage and budget optimization
4. **Enhanced Data Model**: Complete person + company enrichment in Airtable

### **DOCUMENTATION DELIVERABLES**:
1. **Updated Pattern 07**: PDL Person API integration and role detection
2. **Qualification Guide**: Sales role identification and scoring methodology
3. **Cost Analysis**: Person API usage optimization and ROI analysis
4. **Testing Evidence**: Complete role-based testing results and validation

---

## 🔄 **SESSION COORDINATION**

### **SESSION 2 → SESSION 3 HANDOFF**:
- **Company Data Available**: B2B tech company qualification results
- **API Infrastructure**: PDL authentication and basic integration working
- **Cost Tracking**: Budget monitoring system operational
- **Testing Framework**: Reality-based testing protocols established

### **COMPLETION CRITERIA**:
✅ **Person Qualification Working**: PDL Person API integrated with role detection  
✅ **Sales Role Scoring**: Accurate identification of sales professionals and decision makers  
✅ **Cost Optimization**: Intelligent API usage saves costs through selective lookup  
✅ **Data Enhancement**: Complete person + company enriched profiles in Airtable  
✅ **Integration Stability**: No disruption to SESSION-1-2 baseline functionality  

### **HANDOFF TO SESSION 4**:
- **Foundation**: Complete person + company qualification working
- **Next Focus**: ICP scoring and automated lead qualification
- **Data Available**: Full professional profiles for intelligent lead routing
- **Scoring Ready**: Role + company data available for advanced qualification algorithms

---

**SESSION 3 STATUS**: ⏸️ **READY FOR DEVELOPMENT**  
**PREREQUISITE**: SESSION-2 (PDL Company) working with B2B qualification  
**ESTIMATED DURATION**: 3-4 development days with role testing and optimization