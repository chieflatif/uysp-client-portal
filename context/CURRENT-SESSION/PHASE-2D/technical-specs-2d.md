# Phase 2D Technical Specs

## ICP Response Processor (V3.2 Base Caps + Person Location Post-Enrichment)

```javascript
// COMPLETE REPLACEMENT CODE - Fixes all issues
const items = $input.all();

// Get tech/generic domains from static data or defaults
const staticData = $getWorkflowStaticData('global');
const TECH_DOMAINS = staticData.TECH_DOMAINS || [
  'salesforce.com','hubspot.com','microsoft.com','google.com','adobe.com',
  'amazon.com','atlassian.com','slack.com','snowflake.com','datadog.com'
];
const GENERIC_DOMAINS = staticData.GENERIC_DOMAINS || [
  'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com'
];

// V3.2 BASE with PROPER SECTION CAPS (Company 15, Role 40, Engagement 30)
function calculateV3Fallback(data) {
  const reasons = [];
  
  // COMPANY SECTION (15 max)
  let companyScore = 0;
  const email = String(data.email || '').toLowerCase();
  const domain = email.includes('@') ? email.split('@')[1] : '';
  const company = String(data.company || data.company_enriched || '').toLowerCase();
  
  if (TECH_DOMAINS.includes(domain)) {
    companyScore += 15;
    reasons.push('Tech domain +15');
  } else if (GENERIC_DOMAINS.includes(domain)) {
    companyScore -= 10;
    reasons.push('Generic domain -10');
  }
  
  if (company.match(/\b(saas|software|tech|cloud|data|cyber|ai)\b/)) {
    companyScore += 15;
    reasons.push('B2B Tech +15');
  }
  
  // Cap company section
  companyScore = Math.min(15, Math.max(0, companyScore));
  
  // ROLE SECTION (40 max)
  let roleScore = 0;
  const title = String(data.title || data.title_current || '').toLowerCase();
  
  // FIX: Proper substring matching
  if (title.includes('account executive') || title.includes(' ae ') || 
      title.match(/\bae\b/)) {
    roleScore += 20;
    reasons.push('AE +20');
    if (title.includes('senior') || title.includes('enterprise')) {
      roleScore += 5;
      reasons.push('Senior +5');
    }
  } else if (title.includes('account manager')) {
    roleScore += 18;
    reasons.push('AM +18');
  } else if (title.includes('sales manager')) {
    roleScore += 10;
    reasons.push('Sales Mgr +10');
  } else if (title.includes('sdr') || title.includes('bdr')) {
    roleScore += 3;
    reasons.push('SDR/BDR +3');
  }
  
  // Cap role section
  roleScore = Math.min(40, Math.max(0, roleScore));
  
  // ENGAGEMENT SECTION (30 max)
  let engagementScore = 0;
  
  // Handle multiple coaching formats
  const coaching = data.interested_in_coaching;
  if (coaching === true || coaching === 'true' || 
      coaching === 'Yes' || coaching === 'yes' || coaching === 1) {
    engagementScore += 10;
    reasons.push('Coaching +10');
  }
  
  const touchpoints = Number(data.touchpoint_count || 0);
  if (touchpoints >= 3) {
    engagementScore += 15;
    reasons.push('Touchpoints 3+ +15');
  } else if (touchpoints >= 1) {
    engagementScore += 8;
    reasons.push('Touchpoints 1-2 +8');
  }
  
  if (data.webinar_attendee === true || data.webinar_attendee === 'true') {
    engagementScore += 8;
    reasons.push('Webinar +8');
  }
  
  if (data.course_purchaser === true || data.course_purchaser === 'true') {
    engagementScore += 10;
    reasons.push('Course +10');
  }
  
  // FIX: Add missing field
  if (data.sales_focused_motivation === true || 
      data.sales_focused_motivation === 'true') {
    engagementScore += 5;
    reasons.push('Sales motivation +5');
  }
  
  // Cap engagement section
  engagementScore = Math.min(30, Math.max(0, engagementScore));
  
  // Calculate BASE total (pre-location)
  const totalScore = companyScore + roleScore + engagementScore;
  const tier = totalScore >= 90 ? 'Ultra' : 
               totalScore >= 75 ? 'High' : 
               totalScore >= 70 ? 'Qualified' : 'Archive';
  
  // Confidence based on data completeness
  const criticalFields = [
    data.email, data.company, data.title, 
    data.first_name, data.phone_primary
  ].filter(Boolean).length;
  const confidence = 0.4 + (criticalFields * 0.12);
  
  return {
    icp_score: totalScore,
    company_score: companyScore,
    role_score: roleScore,
    engagement_score: engagementScore,
    icp_tier: tier,
    score_reasoning: reasons.join('; '),
    scoring_confidence: Math.min(1.0, confidence),
      scoring_method: 'domain_base_v3_2',
    openai_api_used: false
  };
}

// Process each item
for (const item of items) {
  const input = item.json;
  const aiResponse = input.ai_response || input;
  
  let useAI = false;
  let parsedAI = null;
  
  // Try to parse AI response
  if (aiResponse && aiResponse.content) {
    try {
      let content = typeof aiResponse.content === 'string' ? 
        aiResponse.content : 
        aiResponse.content[0]?.text || JSON.stringify(aiResponse.content);
      
      // Clean markdown
      content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      parsedAI = JSON.parse(content);
      
      // Validate AI response
      if (parsedAI && 
          typeof parsedAI.company_score === 'number' &&
          typeof parsedAI.role_score === 'number' &&
          typeof parsedAI.engagement_score === 'number' &&
          parsedAI.company_score <= 25 &&
          parsedAI.role_score <= 40 &&
          parsedAI.engagement_score <= 35 &&
          parsedAI.confidence >= 0.8) {
        useAI = true;
      }
    } catch (e) {
      // Will use fallback
    }
  }
  
  let result;
  if (useAI && parsedAI) {
    result = {
      ...input,
      icp_score: Math.min(100, parsedAI.total_score),
      company_score: parsedAI.company_score,
      role_score: parsedAI.role_score,
      engagement_score: parsedAI.engagement_score,
      icp_tier: parsedAI.tier,
      score_reasoning: parsedAI.reasoning,
      scoring_confidence: parsedAI.confidence,
      scoring_method: 'ai',
      openai_api_used: true
    };
  } else {
    result = {
      ...input,
      ...calculateV3Fallback(input),
      ai_parse_error: parsedAI ? 'low_confidence' : 'parse_failed'
    };
  }
  
  result.scoring_date = new Date().toISOString();
  result.v3_aligned = true;
  
  item.json = result;
}

return items;
```

## Anomaly Detection (after ICP Response Processor)

```javascript
// Node Name: Anomaly Detection
const items = $input.all();

for (const item of items) {
  const d = item.json;
  
  const tp = Number(d.touchpoint_count || 0);
  const hasCoaching = ['true', 'True', 'yes', 'Yes', true, 1].includes(
    d.interested_in_coaching
  );
  const score = Number(d.icp_score || 0);
  const title = String(d.title || d.title_current || '').toLowerCase();
  
  // Anomaly conditions
  const highEngagementLowScore = tp > 5 && score < 50;
  const coachingNonSales = hasCoaching && 
    !title.includes('sales') && 
    !title.includes('account') &&
    !title.includes('revenue');
  const suspiciousScore = d.scoring_method === 'ai' && 
    d.company_score === 0 && 
    d.role_score === 0 && 
    d.engagement_score > 30;
  
  if (highEngagementLowScore || coachingNonSales || suspiciousScore) {
    d.human_review_needed = true;
    d.anomaly_detected = true;
    d.anomaly_reason = highEngagementLowScore ? 'high_engagement_low_score' :
                       coachingNonSales ? 'coaching_interest_non_sales' :
                       'suspicious_score_distribution';
  } else {
    d.human_review_needed = false;
    d.anomaly_detected = false;
  }
  
  item.json = d;
}

return items;
```

## Person Location Application (post-enrichment)

```
// Node Name: Apply Person Location (post-enrichment)
const items = $input.all();
for (const item of items) {
  const d = item.json;
  const tierPoints = { A: 15, B: 10, C: 4, D: -15 };
  const locTier = d.affordability_tier || null;
  const locConf = Math.max(0, Math.min(1, d.location_confidence ?? 0));
  let locAdj = 0;
  if (locTier && locConf >= 0.5 && tierPoints[locTier] !== undefined) {
    locAdj = Math.round(tierPoints[locTier] * locConf);
  }
  d.location_points_applied = locAdj;
  d.icp_score = Math.min(100, Math.max(0, Number(d.icp_score || 0) + locAdj));
  const score = d.icp_score;
  d.icp_tier = score >= 90 ? 'Ultra' : score >= 75 ? 'High' : score >= 70 ? 'Qualified' : 'Archive';
  const tierDHighConf = (locTier === 'D' && locConf >= 0.7);
  d.outreach_potential = (score >= 70) && !tierDHighConf;
  if ((score >= 70) && tierDHighConf) d.human_review_needed = true;
  item.json = d;
}
return items;
```

## Junk Detection Filter (after Double Failure Router TRUE)

```javascript
// Node Name: Junk Detection Filter
const items = $input.all();

// Get domains from static data
const staticData = $getWorkflowStaticData('global');
const GENERIC_DOMAINS = staticData.GENERIC_DOMAINS || [
  'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com'
];

for (const item of items) {
  const d = item.json.normalized || item.json;
  
  // Junk criteria
  const email = String(d.email || '').toLowerCase();
  const domain = email.includes('@') ? email.split('@')[1] : '';
  
  const isGenericEmail = GENERIC_DOMAINS.includes(domain);
  const noCompanyData = !d.company && !d.company_enriched && !d.pdl_company_name;
  const noPhone = !d.phone_primary && !d.phone_enriched;
  const noLinkedIn = !d.linkedin_url && !d.pdl_linkedin_url;
  const noTitle = !d.title && !d.title_current && !d.pdl_job_title;
  const noEngagement = Number(d.touchpoint_count || 0) === 0;
  
  // Auto-archive if definitely junk
  if (isGenericEmail && noCompanyData && noPhone && 
      noLinkedIn && noTitle && noEngagement) {
    d.processing_status = 'Archived';
    d.archived_reason = 'insufficient_signal';
    d.archived_date = new Date().toISOString();
    d.routing = 'archive';
    d.routing_reason = 'auto_junk_detection';
    d.junk_score = 100;
    item.json = { normalized: d, route: 'archive' };
  } else {
    item.json = { normalized: d, route: 'salvage_check' };
  }
}

return items;
```

## Salvage Pre-Score Calculator (after Junk Filter)

```javascript
// Node Name: Salvage Pre-Score Calculator
const items = $input.all();
const staticData = $getWorkflowStaticData('global');
const TECH_DOMAINS = staticData.TECH_DOMAINS || [
  'salesforce.com','hubspot.com','microsoft.com'
];

for (const item of items) {
  const d = item.json.normalized || item.json;
  
  if (item.json.route !== 'archive') {
    let preScore = 0;
    const signals = [];
    
    const email = String(d.email || '').toLowerCase();
    const domain = email.includes('@') ? email.split('@')[1] : '';
    
    if (TECH_DOMAINS.includes(domain)) {
      preScore += 15;
      signals.push('tech_domain');
    }
    
    if (Number(d.touchpoint_count || 0) >= 1) {
      preScore += 8;
      signals.push('has_engagement');
    }
    
    if (['true', 'Yes', true].includes(d.interested_in_coaching)) {
      preScore += 10;
      signals.push('coaching_interest');
    }
    
    d.salvage_pre_score = preScore;
    d.salvage_signals = signals.join(',');
    
    // Check if salvage should run
    const salvageEnabled = $vars.SALVAGE_DOUBLE_FAIL === 'true';
    
    if (salvageEnabled && preScore >= 20) {
      item.json = { normalized: d, route: 'salvage_scoring' };
    } else {
      item.json = { normalized: d, route: 'human_review' };
    }
  }
}

return items;
```
