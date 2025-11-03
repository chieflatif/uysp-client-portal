# 🚨 CRITICAL WORKSPACE ISOLATION RULES

## UYSP PROJECT WORKSPACE ONLY
**CORRECT**: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/workflows
**WRONG**: https://rebelhq.app.n8n.cloud/workflow/ (personal workspace)

## GOTCHA #18: n8n MCP Workspace Contamination
- n8n MCP tools connect to DEFAULT/PERSONAL workspace
- NOT project-specific workspace
- Creates workflows in wrong location
- Manual transfer required

## MANDATORY CHECKS BEFORE ANY N8N OPERATION:
1. ✅ Verify target workspace URL 
2. ✅ Confirm project context: H4VRaaZhd8VKQANf
3. ✅ Check workflow list matches project expectations
4. ✅ Alert architect if workflows appear in personal workspace

## WORKFLOW TRANSFER PROTOCOL:
If workflow created in wrong workspace:
1. Export workflow JSON from personal workspace
2. Import into project workspace manually
3. Delete from personal workspace
4. Update documentation with correct IDs

## PREVENTION:
- Always state workspace before n8n operations
- Double-check workflow IDs match project workspace
- Document any workspace contamination immediately 