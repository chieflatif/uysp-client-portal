[AUTHORITATIVE]
Last Updated: 2025-08-08

# PHASE 2C TECHNICAL REQUIREMENTS - HUNTER WATERFALL IMPLEMENTATION
## **EVIDENCE-BASED SPECIFICATIONS FOR PDL-FIRST HUNTER FALLBACK**

## Overview

Phase 2C implements Hunter.io Email Enrichment as a non-disruptive fallback after PDL Person API failures. This enhancement maintains PDL as the primary enrichment source while providing Hunter.io as a secondary option to capture LinkedIn profiles, job titles, and company data when PDL fails.

**Implementation Priority**: High  
**Target Completion**: 4-5 days (systematic implementation)  
**Active Baseline**: Phase 2B operational (PDL Person + ICP Scoring working)  
**Current Branch**: feature/pdl-first-hunter-fallback  
**Dependencies**: Hunter API credentials, MCP n8n tools, existing Airtable schema

---

## Technical Requirements

### 1. Hunter.io API Integration

#### 1.1 API Configuration
- **Endpoint**: `https://api.hunter.io/v2/people/find`
- **Authentication**: X-API-KEY header (httpHeaderAuth credential)
- **Method**: GET
- **Query Parameters**:
  - `email`: Required - email address to enrich
  - `api_key`: Required - Hunter API key from credentials

#### 1.2 Rate Limits & Performance
- **Rate Limits**: 15 requests/second, 500 requests/minute
- **Timeout**: 30 seconds with 3 retries
- **Response Time**: ~2-3 seconds average
- **Success Rate**: 85%+ on corporate emails (research-validated)

#### 1.3 Cost Structure
- **Hunter Email Enrichment**: $0.049 per credit
- **Daily Budget**: $50 limit accommodates ~1,000 Hunter calls
- **Cost Tracking**: Real-time logging to Daily_Costs table

---

### 2. Node Implementation Specifications

#### 2.1 Feature Gate (IF Node)
```javascript
{
  "parameters": {
    "conditions": {
      "conditions": [{
        "leftValue": "={{$env.PERSON_WATERFALL_ENABLED}}",
        "rightValue": "true",
        "operator": {
          "type": "string",
          "operation": "equals"
        }
      }]
    }
  },
  "alwaysOutputData": true
}
```

#### 2.2 PDL Success Router (IF Node)
```javascript
{
  "parameters": {
    "conditions": {
      "conditions": [{
        "leftValue": "={{$json.pdl_person_success}}",
        "rightValue": true,
        "operator": {
          "type": "boolean",
          "operation": "equals"
        }
      }]
    }
  },
  "alwaysOutputData": true
}
```

#### 2.3 Hunter HTTP Request Node
```javascript
{
  "parameters": {
    "method": "GET",
    "url": "https://api.hunter.io/v2/people/find",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendHeaders": false,
    "qs": {
      "domain": "={{$json.normalized.company_domain}}",
      "first_name": "={{$json.normalized.first_name}}",
      "last_name": "={{$json.normalized.last_name}}"
    },
    "options": {
      "timeout": 30000,
      "retry": {
        "enabled": true,
        "maxTries": 3
      }
    }
  }
}
```

---

### 3. Data Processing & Field Mapping

#### 3.1 Hunter Response Structure
```javascript
// Expected Hunter API response format
{
  "data": {
    "name": {
      "givenName": "John",
      "familyName": "Doe"
    },
    "employment": {
      "title": "Sales Director",
      "name": "Acme Corp"
    },
    "linkedin": {
      "handle": "johndoe"
    }
  }
}
```

#### 3.2 Field Mapping Logic
| **Canonical Field** | **PDL Source** | **Hunter Source** | **Precedence** |
|-------------------|---------------|------------------|----------------|
| `linkedin_url` | `linkedin_url` or `profiles.linkedin_url` | `linkedin.handle` → full URL | PDL > Hunter |
| `title_current` | `job_title` | `employment.title` | PDL > Hunter |
| `company_enriched` | `employment.name` | `employment.name` | PDL > Hunter |
| `first_name` | `name.first` | `name.givenName` | Smart Mapper v4.6 |
| `last_name` | `name.last` | `name.familyName` | Smart Mapper v4.6 |

#### 3.3 Enrichment Metadata
```javascript
// Added to every lead record
{
  enrichment_vendor: 'pdl' | 'hunter',           // Which provider succeeded
  enrichment_attempted: true,                     // Enrichment was attempted
  enrichment_failed: false,                      // Both providers failed
  last_enriched: '2025-01-27T10:00:00.000Z',    // Timestamp
  pdl_person_cost: 0.03,                        // PDL cost (if used)
  hunter_cost: 0.049,                           // Hunter cost (if used)
  total_processing_cost: 0.08                   // Cumulative cost for lead
}
```

---

### 4. Airtable Schema Updates

#### 4.1 People Table - New Fields (Optional)
```javascript
// Hunter-specific enrichment fields
{
  enrichment_vendor: {
    type: 'singleSelect',
    options: ['pdl', 'hunter'],
    description: 'Primary enrichment provider used for this record'
  },
  enrichment_confidence: {
    type: 'number',
    format: 'integer',
    description: 'Confidence score 0-100 from enrichment provider'
  },
  hunter_cost: {
    type: 'currency',
    symbol: '$',
    precision: 3,
    description: 'Cost incurred for Hunter.io enrichment'
  },
  enrichment_method_primary: {
    type: 'singleSelect', 
    options: ['pdl', 'hunter', 'both'],
    description: 'Track which method provided the final data'
  }
}
```

#### 4.2 Daily_Costs Table - Enhanced Tracking
```javascript
// Additional cost tracking fields
{
  pdl_person_costs: {
    type: 'currency',
    symbol: '$',
    precision: 3,
    description: 'Daily total PDL Person API costs'
  },
  hunter_costs: {
    type: 'currency', 
    symbol: '$',
    precision: 3,
    description: 'Daily total Hunter.io enrichment costs'
  }
}
```

---

### 5. Testing & Validation Requirements

#### 5.1 Regression Testing
- **Sample Size**: 50 leads that previously succeeded with PDL
- **Success Criteria**: 95%+ PDL success rate maintained
- **Validation**: Hunter fallback never triggers for PDL successes

#### 5.2 Fallback Effectiveness
- **Sample Size**: 50 leads that previously failed PDL enrichment
- **Success Criteria**: 65%+ Hunter success rate on PDL failures
- **Validation**: LinkedIn URLs, job titles, company names captured

#### 5.3 Performance Benchmarks
- **Current Processing Time**: 12 seconds average
- **Target with Hunter**: <20 seconds average
- **Monitoring**: Real-time performance tracking

---

### 6. Security & Compliance

#### 6.1 Credential Management
- **Hunter API Key**: Stored as predefined credential in n8n
- **Authentication Pattern**: httpHeaderAuth (never manual headers)
- **Credential Security**: Follow established n8n credential patterns

#### 6.2 Data Privacy
- **Email Processing**: Only corporate emails, no personal data retention
- **API Compliance**: Adhere to Hunter.io terms of service
- **Data Retention**: Cache enrichment results for 30 days maximum

---

### 7. Monitoring & Alerting

#### 7.1 Real-Time Metrics
- **PDL Success Rate**: Alert if drops below 85% (current: 90%+)
- **Hunter API Errors**: Alert if >5% error rate over 1-hour window
- **Processing Time**: Alert if median >20 seconds (current: 12s)
- **Daily Costs**: Alert at $40 (80% of $50 limit)

#### 7.2 Cost Monitoring
- **PDL vs Hunter Usage**: Track ratio of primary vs fallback usage
- **Cost per Lead**: Monitor blended cost per enriched lead
- **Budget Enforcement**: Circuit breaker at daily limit

---

### 8. Rollback Procedures

#### 8.1 Feature Flag Rollback
1. **Environment Variable**: Set `PERSON_WATERFALL_ENABLED=false`
2. **Verification**: Test sample lead to confirm Hunter bypass
3. **Monitoring**: Confirm PDL success path restored

#### 8.2 Emergency Rollback
1. **Workflow Restore**: Import pre-implementation Q2ReTnOliUTuuVpl JSON
2. **Environment Cleanup**: Remove Hunter-specific variables
3. **Credential Removal**: Delete Hunter API credential if needed

---

## Implementation Timeline

### Phase 1 (Day 1): Environment Setup
- [ ] Hunter API credentials configuration
- [ ] Environment variables setup
- [ ] Feature gate implementation and testing

### Phase 2 (Day 2-3): Core Implementation
- [ ] PDL success router implementation
- [ ] Hunter HTTP Request node configuration
- [ ] Hunter response processor development

### Phase 3 (Day 4): Data Integration
- [ ] Person data merger with precedence logic
- [ ] Enhanced cost tracking implementation
- [ ] Airtable schema updates

### Phase 4 (Day 5): Testing & Validation
- [ ] Regression testing (50 PDL success leads)
- [ ] Fallback testing (50 PDL failure leads)
- [ ] Performance and cost validation

---

**Technical Requirements Status**: ✅ **COMPLETE AND READY**  
**Last Updated**: 2025-01-27  
**Implementation Ready**: ✅ **YES**  
**Apollo Contamination**: ✅ **REMOVED**

These technical requirements provide comprehensive specifications for implementing the **PDL-first Hunter waterfall strategy** with all necessary technical details, validation criteria, and safety procedures.
