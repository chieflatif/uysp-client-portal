#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DATE_TODAY="${1:-$(date +%F)}"

help_on_fail() {
  cat <<'EOF'
❌ Documentation checks failed.

Quick fix options:
1) Auto-normalize + validate again:
   bash UYSP Lead Qualification V1/scripts/docs-guard.sh

2) See what's wrong (last lines above show the first failing paths):
   - Missing tag/date → add [AUTHORITATIVE] or [HISTORICAL] and "Last Updated: YYYY-MM-DD" at top
   - Broken link → update the link path or archive the page
   - Duplicate content → remove the duplicate or archive the older copy

Authoritative entry point: docs/README.md
If a page isn’t linked there, it’s not current.
EOF
}

trap 'help_on_fail; exit 1' ERR

echo "🧪 Adding headers (date: $DATE_TODAY)…"
bash "$ROOT_DIR/scripts/add-doc-headers.sh" "$DATE_TODAY"

echo "🧪 Validating tags/duplicates…"
bash "$ROOT_DIR/scripts/validate-docs.sh"

echo "🧪 Checking links…"
python3 "$ROOT_DIR/scripts/check-links.py"

echo "✅ Docs guard passed"



