# System Backup & Restoration Procedures

**Document Version**: 1.0
**Date**: 2025-08-26
**Status**: Authoritative Guide

---

## 1. Overview

To prevent a recurrence of the catastrophic documentation and workflow loss, the following backup and restoration procedures are now considered a mandatory part of the project's operational lifecycle. The process is designed to be simple, automated, and reliable.

The core of the backup strategy is to programmatically download the JSON definitions of all critical n8n workflows and store them in a version-controlled repository.

---

## 2. Automated Backup Procedure

A shell script will be used to automatically back up all n8n workflows. This script should be run on a regular schedule (e.g., daily via a cron job).

### 2.1. Backup Script (`scripts/backup_workflows.sh`)

```bash
#!/bin/bash

# Configuration
N8N_URL="https://rebelhq.app.n8n.cloud"
# It is recommended to store the API key in a secure environment variable
# N8N_API_KEY="your_n8n_api_key_here" 
BACKUP_DIR="workflows/backups"
DATE_SUFFIX=$(date +"%Y%m%d_%H%M%S")

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Fetch all workflows from the n8n API
echo "Fetching workflows from $N8N_URL..."
WORKFLOWS=$(curl -s --request GET \
  --url "$N8N_URL/api/v1/workflows" \
  --header "Authorization: Bearer $N8N_API_KEY" \
  --header "Content-Type: application/json")

# Check if the curl command was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to fetch workflows. Check your n8n URL and API key."
    exit 1
fi

# Parse the JSON and save each workflow
echo "$WORKFLOWS" | jq -c '.data[]' | while read i; do
  ID=$(echo "$i" | jq -r '.id')
  NAME=$(echo "$i" | jq -r '.name' | sed 's/[^a-zA-Z0-9]/-/g')
  FILENAME="$BACKUP_DIR/${NAME}-${ID}-${DATE_SUFFIX}.json"
  
  echo "Backing up workflow: '$NAME' (ID: $ID) to $FILENAME"
  
  # Fetch the full workflow JSON
  WORKFLOW_JSON=$(curl -s --request GET \
    --url "$N8N_URL/api/v1/workflows/$ID" \
    --header "Authorization: Bearer $N8N_API_KEY" \
    --header "Content-Type: application/json")

  # Save the workflow to the file
  echo "$WORKFLOW_JSON" | jq '.' > "$FILENAME"
done

echo "Workflow backup complete."

# It is highly recommended to commit these backups to a git repository
# git add $BACKUP_DIR
# git commit -m "Automated n8n workflow backup for $DATE_SUFFIX"
# git push
```

### 2.2. Script Dependencies
- `curl`: Standard command-line tool for transferring data with URLs.
- `jq`: A lightweight and flexible command-line JSON processor.

### 2.3. Scheduling the Backup
This script can be scheduled to run automatically using a cron job. For example, to run it every night at 2 AM, you would add the following line to your crontab:
```
0 2 * * * /path/to/your/project/scripts/backup_workflows.sh
```

---

## 3. Restoration Procedure

Restoring a workflow from a backup is a manual process that should be performed with care.

### 3.1. Restoring an n8n Workflow
1.  **Identify the Backup File:** Locate the correct JSON file for the workflow you wish to restore from the `workflows/backups` directory.
2.  **Open the n8n Editor:** Navigate to your n8n instance in your web browser.
3.  **Import from Clipboard:**
    -   Create a new, empty workflow.
    -   Open the backup JSON file in a text editor and copy its entire contents to your clipboard.
    -   In the n8n editor, go to `File` > `Import from Clipboard`.
    -   Paste the JSON content into the dialog box and click "Import."
4.  **Verify and Activate:**
    -   Thoroughly inspect the imported workflow to ensure all nodes and connections are correct.
    -   **CRITICAL:** Re-select any necessary credentials (e.g., for Airtable, SimpleTexting) in the relevant nodes. Credentials are not exported in the JSON and must be re-linked.
    -   Once verified, activate the workflow.

### 3.2. Restoring the Airtable Base
Airtable provides its own snapshot and backup features. It is recommended to familiarize yourself with these features and take periodic snapshots, especially before major data operations.
1.  **Navigate to Base History:** Open your Airtable base, and click on the "History" icon in the top right.
2.  **Take a Snapshot:** Before making major changes, it's wise to manually take a snapshot.
3.  **Restore from Snapshot:** From the history panel, you can view past snapshots and choose to restore the base to a previous state if necessary.

---

## 4. Final Recommendation
Regularly running the automated backup script and committing the results to a version-controlled repository is the most effective way to prevent a future loss of work.
