# Test Payloads Specification

## 🧪 STANDARDIZED TEST PAYLOADS

### **Category A: Field Mapping Validation Tests**

#### **A1.1: Basic Kajabi Format**
```json
{
  "email": "a1-1-basic@example.com",
  "name": "John Doe",
  "phone": "555-0001",
  "company": "Acme Corp",
  "request_id": "A1-1-basic-kajabi"
}
```

#### **A1.2: Alternative Field Names**
```json
{
  "email_address": "a1-2-alt@example.com",
  "full_name": "Jane Smith", 
  "phone_number": "555-0002",
  "company_name": "Tech Solutions",
  "request_id": "A1-2-alternative-names"
}
```

#### **A1.3: Case Variations**
```json
{
  "EMAIL": "a1-3-case@example.com",
  "Name": "Bob Johnson",
  "PHONE": "555-0003", 
  "Company": "CASE Corp",
  "request_id": "A1-3-case-variations"
}
```

#### **A1.4: Snake_case Variations**
```json
{
  "email": "a1-4-snake@example.com",
  "first_name": "Alice",
  "last_name": "Wilson",
  "phone_number": "555-0004",
  "company_name": "Snake_Case_Inc",
  "request_id": "A1-4-snake-case"
}
```

#### **A1.5: CamelCase Variations**
```json
{
  "emailAddress": "a1-5-camel@example.com",
  "firstName": "Charlie",
  "lastName": "Brown",
  "phoneNumber": "555-0005",
  "companyName": "CamelCase Corp",
  "request_id": "A1-5-camel-case"
}
```

#### **A2.1: Full Name Splitting**
```json
{
  "email": "a2-1-split@example.com",
  "name": "David Michael Thompson",
  "phone": "555-0006",
  "request_id": "A2-1-name-splitting"
}
```

#### **A2.2: Multi-word Last Names**
```json
{
  "email": "a2-2-multi@example.com", 
  "name": "Maria van der Berg",
  "phone": "555-0007",
  "request_id": "A2-2-multi-word-lastname"
}
```

#### **A2.3: Single Name**
```json
{
  "email": "a2-3-single@example.com",
  "name": "Madonna",
  "phone": "555-0008",
  "request_id": "A2-3-single-name"
}
```

#### **A2.4: Missing Name**
```json
{
  "email": "a2-4-missing@example.com",
  "phone": "555-0009",
  "company": "NoName Corp",
  "request_id": "A2-4-missing-name"
}
```

#### **A3.1: All Fields Present**
```json
{
  "email": "a3-1-complete@example.com",
  "name": "Complete Record",
  "phone": "555-0010",
  "company": "Full Data Corp",
  "title": "CEO",
  "linkedin": "https://linkedin.com/in/complete",
  "source_form": "landing_page",
  "interested_in_coaching": "yes",
  "qualified_lead": "true",
  "contacted": "no",
  "request_id": "A3-1-all-fields"
}
```

#### **A3.2: Partial Field Set**
```json
{
  "email": "a3-2-partial@example.com",
  "name": "Partial Record",
  "request_id": "A3-2-partial-fields"
}
```

#### **A3.3: Unknown Fields**
```json
{
  "email": "a3-3-unknown@example.com",
  "name": "Unknown Fields Test",
  "phone": "555-0011",
  "custom_field_1": "value1",
  "weird_data": "should_be_logged",
  "mystery_field": "unknown",
  "request_id": "A3-3-unknown-fields"
}
```

### **Category B: Boolean Conversion Tests**

#### **B1.1: String "true"**
```json
{
  "email": "b1-1-true@example.com",
  "name": "True Test",
  "interested_in_coaching": "true",
  "qualified_lead": "true",
  "contacted": "true",
  "request_id": "B1-1-string-true"
}
```

#### **B1.2: String "yes"**
```json
{
  "email": "b1-2-yes@example.com",
  "name": "Yes Test",
  "interested_in_coaching": "yes",
  "qualified_lead": "yes", 
  "contacted": "yes",
  "request_id": "B1-2-string-yes"
}
```

#### **B1.3: String "1"**
```json
{
  "email": "b1-3-one@example.com",
  "name": "One Test",
  "interested_in_coaching": "1",
  "qualified_lead": "1",
  "contacted": "1", 
  "request_id": "B1-3-string-one"
}
```

#### **B1.4: String "on"**
```json
{
  "email": "b1-4-on@example.com",
  "name": "On Test",
  "interested_in_coaching": "on",
  "qualified_lead": "on",
  "contacted": "on",
  "request_id": "B1-4-string-on"
}
```

#### **B1.5: String "checked"**
```json
{
  "email": "b1-5-checked@example.com",
  "name": "Checked Test",
  "interested_in_coaching": "checked",
  "qualified_lead": "checked",
  "contacted": "checked",
  "request_id": "B1-5-string-checked"
}
```

#### **B2.1: String "false" (CRITICAL)**
```json
{
  "email": "b2-1-false@example.com",
  "name": "False Test",
  "interested_in_coaching": "false",
  "qualified_lead": "false", 
  "contacted": "false",
  "request_id": "B2-1-string-false"
}
```

#### **B2.2: String "no"**
```json
{
  "email": "b2-2-no@example.com",
  "name": "No Test",
  "interested_in_coaching": "no",
  "qualified_lead": "no",
  "contacted": "no",
  "request_id": "B2-2-string-no"
}
```

#### **B2.3: String "0" (ORIGINAL FAILING CASE)**
```json
{
  "email": "b2-3-zero@example.com",
  "name": "Zero Test",
  "interested_in_coaching": "0",
  "qualified_lead": "0",
  "contacted": "0",
  "request_id": "B2-3-string-zero"
}
```

#### **B2.4: String "off"**
```json
{
  "email": "b2-4-off@example.com",
  "name": "Off Test", 
  "interested_in_coaching": "off",
  "qualified_lead": "off",
  "contacted": "off",
  "request_id": "B2-4-string-off"
}
```

#### **B2.5: Empty String**
```json
{
  "email": "b2-5-empty@example.com",
  "name": "Empty Test",
  "interested_in_coaching": "",
  "qualified_lead": "",
  "contacted": "",
  "request_id": "B2-5-empty-string"
}
```

#### **B3.1: Undefined Boolean Fields**
```json
{
  "email": "b3-1-undefined@example.com",
  "name": "Undefined Test",
  "phone": "555-0020",
  "request_id": "B3-1-undefined-booleans"
}
```

#### **B3.2: Case Insensitive**
```json
{
  "email": "b3-2-case@example.com",
  "name": "Case Test",
  "interested_in_coaching": "TRUE",
  "qualified_lead": "False", 
  "contacted": "YES",
  "request_id": "B3-2-case-insensitive"
}
```

#### **B3.3: Mixed Boolean Fields**
```json
{
  "email": "b3-3-mixed@example.com",
  "name": "Mixed Test",
  "interested_in_coaching": "true",
  "qualified_lead": "false",
  "contacted": "1",
  "request_id": "B3-3-mixed-booleans"
}
```

### **Category C: Integration & Flow Tests**

#### **C1.1: Test URL Basic**
```json
{
  "email": "c1-1-test@example.com",
  "name": "Test URL Validation",
  "phone": "555-0030",
  "request_id": "C1-1-test-url"
}
```

#### **C1.2: Production URL Basic**
```json
{
  "email": "c1-2-prod@example.com",
  "name": "Production URL Validation",
  "phone": "555-0031",
  "request_id": "C1-2-production-url"
}
```

#### **C2.1: New Email**
```json
{
  "email": "c2-1-new@example.com",
  "name": "New Email Test",
  "phone": "555-0032",
  "request_id": "C2-1-new-email"
}
```

#### **C2.2: Duplicate Email**
```json
{
  "email": "c2-1-new@example.com",
  "name": "Duplicate Email Test", 
  "phone": "555-0033",
  "company": "Updated Company",
  "request_id": "C2-2-duplicate-email"
}
```

#### **C3.4: International Phone**
```json
{
  "email": "c3-4-intl@example.com",
  "name": "International Test",
  "phone": "+44 7700 900123",
  "request_id": "C3-4-international-phone"
}
```

### **Category D: Error Handling & Edge Cases**

#### **D1.1: Missing Required Email**
```json
{
  "name": "No Email Test",
  "phone": "555-0040",
  "request_id": "D1-1-missing-email"
}
```

#### **D1.2: Invalid Email Format**
```json
{
  "email": "invalid-email-format",
  "name": "Invalid Email Test",
  "phone": "555-0041",
  "request_id": "D1-2-invalid-email"
}
```

#### **D1.4: Special Characters**
```json
{
  "email": "d1-4-special@example.com",
  "name": "José María Núñez-Öberg",
  "phone": "555-0042",
  "company": "Spëcïål Çhäracters Inc.",
  "request_id": "D1-4-special-characters"
}
```

#### **D1.5: Long Field Values**
```json
{
  "email": "d1-5-long@example.com",
  "name": "VeryLongFirstNameThatExceedsNormalLimits VeryLongLastNameThatAlsoExceedsTypicalDatabaseConstraints",
  "phone": "555-0043",
  "company": "ThisIsAnExtremelyLongCompanyNameThatTestsTheLimitsOfWhatOurSystemCanHandleAndProcessWithoutFailingOrCausingIssues",
  "request_id": "D1-5-extremely-long-field-values"
}
```

## **Expected Results Specification**

### **Category A Expected Results**
- **A1.1-A1.5**: All should create records with properly mapped standard fields
- **A2.1**: Should split "David Michael Thompson" → first_name: "David", last_name: "Michael Thompson"
- **A2.2**: Should split "Maria van der Berg" → first_name: "Maria", last_name: "van der Berg"
- **A2.3**: Should handle "Madonna" → first_name: "Madonna", last_name: undefined or empty
- **A3.3**: Should log "custom_field_1", "weird_data", "mystery_field" in Field_Mapping_Log

### **Category B Expected Results**
- **B1.1-B1.5**: All boolean fields should be `true` in Airtable
- **B2.1-B2.5**: All boolean fields should be `null` in Airtable (NOT false)
- **B3.1**: Boolean fields should be undefined/not set
- **B3.3**: interested_in_coaching: true, qualified_lead: null, contacted: true

### **Category C Expected Results**
- **C1.1**: Should work via test URL
- **C1.2**: Should work via production URL (if workflow active)
- **C2.1**: Should create new record
- **C2.2**: Should update existing record, increment duplicate_count
- **C3.4**: Should set international_phone: true, phone_country_code: "+44"

### **Category D Expected Results**
- **D1.1**: Should fail gracefully or create record with empty email
- **D1.2**: Should handle invalid email appropriately
- **D1.4**: Should preserve special characters correctly
- **D1.5**: Should handle or truncate long values appropriately

## **Test Execution Commands**

### **Basic Test Command Template**
```bash
curl -X POST "https://rebelhq.app.n8n.cloud/webhook-test/kajabi-leads" \
  -H "Content-Type: application/json" \
  -d '${TEST_PAYLOAD}'
```

### **Production Test Command Template**  
```bash
curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" \
  -H "Content-Type: application/json" \
  -d '${TEST_PAYLOAD}'
```

**Prerequisites Met**: ✅ Complete test payload specifications ready for automated execution