#!/bin/bash

# Minimal n8n API export tester (no changes to main backup script)
# Usage (env vars):
#   N8N_API_URL="https://<subdomain>.app.n8n.cloud" \
#   N8N_API_KEY="<api-key-or-jwt>" \
#   WORKFLOW_ID="<workflowId>" \
#   bash scripts/test-n8n-export.sh

set -euo pipefail

N8N_API_URL=${N8N_API_URL:-}
N8N_API_KEY=${N8N_API_KEY:-}
WORKFLOW_ID=${WORKFLOW_ID:-}
N8N_PROJECT_ID=${N8N_PROJECT_ID:-}

if [[ -z "${N8N_API_URL}" || -z "${N8N_API_KEY}" || -z "${WORKFLOW_ID}" ]]; then
  echo "❌ Missing required env vars. Set N8N_API_URL, N8N_API_KEY, WORKFLOW_ID"
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUT_DIR="./workflows/backups"
OUT_FILE="${OUT_DIR}/API-TEST-${WORKFLOW_ID}-${TIMESTAMP}.json"
TMP_FILE="${OUT_FILE}.tmp"
mkdir -p "${OUT_DIR}"

echo "🔎 Testing n8n API export for workflow ${WORKFLOW_ID}"
echo "🌐 ${N8N_API_URL}"

attempt() {
  local desc="$1"; shift
  echo "\n➡️  Attempt: ${desc}"
  local code
  # shellcheck disable=SC2068
  code=$(curl -sS -w "%{http_code}" "$@" -o "${TMP_FILE}" || true)
  echo "HTTP ${code}"
  if [[ "${code}" == "200" ]]; then
    if command -v jq >/dev/null 2>&1; then
      jq '.' "${TMP_FILE}" > "${OUT_FILE}"
    else
      mv "${TMP_FILE}" "${OUT_FILE}"
    fi
    rm -f "${TMP_FILE}" 2>/dev/null || true
    echo "✅ Saved: ${OUT_FILE} ($(wc -c < "${OUT_FILE}") bytes)"
    exit 0
  else
    echo "↪️  Response snippet:"; head -c 200 "${TMP_FILE}" 2>/dev/null || true; echo
  fi
}

# Try /api/v1 with X-N8N-API-KEY (Personal Access Token style)
attempt \
  "X-N8N-API-KEY to /api/v1" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" -H "Accept: application/json" \
  "${N8N_API_URL%/}/api/v1/workflows/${WORKFLOW_ID}"

# Try /api/v1 with Bearer (JWT/Public token style)
attempt \
  "Bearer to /api/v1" \
  -H "Authorization: Bearer ${N8N_API_KEY}" -H "Accept: application/json" \
  "${N8N_API_URL%/}/api/v1/workflows/${WORKFLOW_ID}"

# Try /api/v1 with Bearer + project header
if [[ -n "${N8N_PROJECT_ID}" ]]; then
  attempt \
    "Bearer + project header to /api/v1" \
    -H "Authorization: Bearer ${N8N_API_KEY}" -H "n8n-project-id: ${N8N_PROJECT_ID}" -H "Accept: application/json" \
    "${N8N_API_URL%/}/api/v1/workflows/${WORKFLOW_ID}"
  attempt \
    "Bearer + projectId query to /api/v1" \
    -H "Authorization: Bearer ${N8N_API_KEY}" -H "Accept: application/json" \
    "${N8N_API_URL%/}/api/v1/workflows/${WORKFLOW_ID}?projectId=${N8N_PROJECT_ID}"
fi

# Try legacy /rest with both header styles
attempt \
  "X-N8N-API-KEY to /rest" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" -H "Accept: application/json" \
  "${N8N_API_URL%/}/rest/workflows/${WORKFLOW_ID}"

attempt \
  "Bearer to /rest" \
  -H "Authorization: Bearer ${N8N_API_KEY}" -H "Accept: application/json" \
  "${N8N_API_URL%/}/rest/workflows/${WORKFLOW_ID}"

echo "❌ All attempts failed. Likely need a Personal Access Token from n8n (Settings → n8n API → Create API key)."
rm -f "${TMP_FILE}" 2>/dev/null || true
exit 1


