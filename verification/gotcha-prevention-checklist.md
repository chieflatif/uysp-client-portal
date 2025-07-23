# Platform Gotcha Prevention Checklist

## 🚨 Before ANY Session Implementation

### UI-Only Settings (Cannot Be Automated)
- [ ] **Gotcha #1**: All IF/Switch nodes have "Always Output Data" enabled in Settings tab
- [ ] **Gotcha #2**: Credentials selected via UI dropdown (not MCP)
- [ ] **Gotcha #15**: Settings tab expanded and reviewed for all nodes

### Expression Syntax 
- [ ] **Gotcha #3**: All expressions use proper spacing: `{{ $json.field }}`
- [ ] **Gotcha #4**: Complex formulas built in Code nodes, not inline

### Data References
- [ ] **Gotcha #6**: Table operations use IDs `tblXXXXXXXXXXXXXX` not names
- [ ] **Gotcha #7**: Boolean fields normalized in Smart Field Mapper
- [ ] **Gotcha #8**: Date fields formatted correctly for Airtable

### Webhook Testing
- [ ] **Gotcha #5**: Webhook test protocol understood - manual Execute each time
- [ ] **Gotcha #12**: Environment-specific webhook URLs configured

### Performance & Limits
- [ ] **Gotcha #10**: Workflows split if >5 min execution expected
- [ ] **Gotcha #13**: Batch operations limited to 100 items
- [ ] **Gotcha #14**: Code nodes use only built-in Node.js functions

## 🚨 During Development

### Error Detection
- [ ] Run `node scripts/detect-gotchas.js "error message"` for any failures
- [ ] Check platform gotchas documentation before troubleshooting
- [ ] Verify error structure in error workflows (Gotcha #9)

### Integration Testing
- [ ] Test with external tool (curl/Postman), not n8n test button
- [ ] Verify actual Airtable records created, not just HTTP 200
- [ ] Check field mapping percentage with unknown field logging

## 🚨 After Implementation

### Validation
- [ ] All session evidence requirements met
- [ ] Platform gotchas section completed in evidence
- [ ] Workflow exported and backed up
- [ ] Recovery procedures tested (credential re-selection)

### Documentation
- [ ] Session-specific gotchas documented
- [ ] Known issues logged for future reference
- [ ] Gotcha detection patterns updated if new issues found

## 🚨 Session-Specific Gotcha Focus

### Session 0 (Field Normalization)
- [ ] Smart Field Mapper first node after webhook
- [ ] Boolean conversion patterns implemented
- [ ] Unknown field logging working

### Session 1 (Foundation Webhook)
- [ ] Webhook test mode protocol followed
- [ ] Expression spacing in IF nodes
- [ ] Table IDs used in Airtable operations

### Session 2 (SMS Compliance) 
- [ ] Date/time formatting for TCPA checks
- [ ] DND list table ID references
- [ ] Monthly limit calculations

### Session 3 (Qualification)
- [ ] Apollo API credential UI selection
- [ ] Cost tracking expressions
- [ ] ICP scoring error handling

### Session 4 (SMS Sending)
- [ ] SimpleTexting credential selection
- [ ] Template length validation
- [ ] Test mode phone override

## 🚨 Recovery Procedures

### When Credentials Break (Gotcha #2)
1. Export workflow to JSON
2. Delete broken workflow  
3. Import JSON as new workflow
4. Manually re-select ALL credentials via UI
5. Test every connection

### When IF/Switch Stops (Gotcha #1)
1. Open workflow in n8n UI
2. Click on IF/Switch node
3. Go to Settings tab (NOT Parameters)
4. Enable "Always Output Data" toggle
5. Save and test

### When Expressions Fail (Gotcha #3)
1. Check spacing: `{{ $json.field }}`
2. Move complex logic to Code node
3. Use simple variable references downstream
4. Test expressions in isolation

## 🚨 Prevention Success Metrics
- Zero "No output data returned" errors
- Zero "No authentication data defined" errors  
- Zero "Table not found" errors
- All webhook tests work on first try
- All expressions parse correctly
- Field mapping rates >95% 