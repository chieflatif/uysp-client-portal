# Original SMS Trigger - Manual Fix Instructions

To fix the original UYSP-SMS-Trigger workflow (D10qtcjjf2Vmmp5j):

## In the n8n UI Editor:

1. Open the original UYSP-SMS-Trigger workflow: https://rebelhq.app.n8n.cloud/workflow/D10qtcjjf2Vmmp5j
2. Click on "Airtable Update" node
3. Re-configure these settings:
   - **Resource**: Record
   - **Operation**: Update
   - **Base**: app6cU9HecxLpgT0P (or select from dropdown)
   - **Table**: tblYUvhGADerbD8EO (or select "Leads")
   - **ID**: `{{$item(0).$node["Airtable Get Record"].json.id}}`
   
4. In the **Columns** section, set:
   - **Processing Status**: Complete
   - **SMS Eligible**: `{{false}}`
   - **SMS Status**: `{{$json.sms_status}}`
   - **SMS Campaign ID**: `{{$json.campaign_id}}`
   - **SMS Cost**: `{{$json.estimated_cost || 0}}`
   - **Last SMS Sent**: `{{$now}}`
   - **SMS Sent Count**: `{{($item(0).$node["Airtable Get Record"].json.fields['SMS Sent Count'] || 0) + 1}}`
   - **Error Log**: `{{$json.error_reason || ''}}`

5. Enable **Typecast** option
6. Save the workflow
7. **IMMEDIATELY close the editor tab** to prevent re-corruption
8. Re-activate the workflow if needed

## Important Notes:
- The Parse SMS Response node should already be set to "Run Once for Each Item" (I fixed this via API)
- The SMS sending is working correctly
- Only the Airtable Update node needs manual fixing due to UI corruption

## Testing:
Update any record in the SMS Pipeline view in Airtable to trigger the workflow.

## Alternative:
If you prefer, you can also import the corrected JSON from:
`workflows/backups/UYSP-SMS-Trigger-D10qtcjjf2Vmmp5j-20250827_corrected.json`

