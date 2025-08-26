# V2 SMS Trigger - Manual Fix Instructions

The V2 workflow has the same UI corruption issue. To fix it:

## In the n8n UI Editor:

1. Open V2-UYSP-SMS-Trigger workflow
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

## Testing:
The workflow will automatically trigger when records in SMS Pipeline view are updated.

## Evidence from execution 2774:
- SMS sent successfully to both test records
- Campaign IDs: 68adf66cb4d37773b23c62ec, 68adf66cb4d37773b23c62f0
- Airtable update failed due to UI corruption

