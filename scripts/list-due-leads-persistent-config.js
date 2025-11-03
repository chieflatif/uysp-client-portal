// CRITICAL PERMANENT CONFIGURATION FOR LIST DUE LEADS NODE
// =====================================================
// DO NOT MODIFY WITHOUT UNDERSTANDING PRODUCTION IMPACT
// 
// This configuration ensures the SMS sequencer can:
// 1. Allow new leads (Position=0) only if they meet SMS Eligible criteria
// 2. Allow continuing leads (Position>0) to bypass SMS Eligible check
// 3. Prevent stopped/booked leads from being processed
// 4. Work with high volume production loads

const LIST_DUE_LEADS_CONFIG = {
  // Node identification
  nodeId: "list-due",
  nodeName: "List Due Leads",
  nodeType: "n8n-nodes-base.airtable",
  
  // CRITICAL: These parameters MUST be set correctly
  parameters: {
    operation: "search",
    
    // Airtable Base ID (UYSP Lead Qualification)
    base: {
      mode: "id",
      value: "app4wIsBfpJTg7pWS"
    },
    
    // Table ID (Leads table)
    table: {
      mode: "list", 
      value: "tblYUvhGADerbD8EO"
    },
    
    // PRODUCTION-READY FILTER FORMULA
    // This formula is the result of extensive testing and fixes
    filterByFormula: `AND(
      {Phone Valid},
      NOT({SMS Stop}),
      NOT({Booked}),
      LEN({Phone})>0,
      OR({Processing Status}='Queued',{Processing Status}='In Sequence'),
      OR({SMS Sequence Position}>0,{SMS Eligible})
    )`,
    
    // Options (empty object required for proper node config)
    options: {}
  },
  
  // Credential reference
  credentials: {
    airtableTokenApi: {
      id: "Zir5IhIPeSQs72LR",
      name: "Airtable UYSP Option C"
    }
  },
  
  // Position in workflow canvas
  position: [-736, -144]
};

// FILTER LOGIC EXPLANATION
// ========================
// 
// REQUIRED FOR ALL LEADS:
// - {Phone Valid} = true (has valid phone number)
// - NOT({SMS Stop}) = SMS Stop is false/empty
// - NOT({Booked}) = Booked is false/empty  
// - LEN({Phone})>0 = Phone field is not empty
// - {Processing Status} IN ('Queued', 'In Sequence')
//
// SMART ELIGIBILITY CHECK:
// - OR({SMS Sequence Position}>0, {SMS Eligible})
//   * If Position > 0: Lead is already in sequence, bypass eligibility
//   * If Position = 0: Lead must meet SMS Eligible criteria
//
// SMS ELIGIBLE CRITERIA (for new leads only):
// - Phone Valid = true
// - ICP Score >= 70
// - Location Country = "United States"
// - SMS Status = "Not Sent" or empty
// - HRQ Status != "Archive"

// BUSINESS LOGIC VERIFICATION
// ===========================
// ✅ Initial eligibility preserved: ICP≥70, US, Phone Valid required for entry
// ✅ Sequence continuation enabled: In-progress leads bypass eligibility 
// ✅ Stop/Booked honored: Both flags immediately halt sequences
// ✅ Processing Status filtering: Only Queued/In Sequence processed
// ✅ High volume ready: No artificial blocking or same-day dedupe

// TESTING EVIDENCE
// ===============
// - Execution 2967: Step 1 sent successfully to 2 leads
// - Execution 2971: Step 2 initially blocked (before fix)
// - After fix: Both leads found for Step 2 continuation
// - Production impact: Sequences can complete all 3 steps

// EXPORT FOR VERIFICATION
module.exports = LIST_DUE_LEADS_CONFIG;

// JSON EXPORT FOR N8N IMPORT
const exportForN8n = JSON.stringify(LIST_DUE_LEADS_CONFIG, null, 2);
console.log('List Due Leads Configuration:');
console.log(exportForN8n);
