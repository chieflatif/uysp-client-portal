#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "[1/3] Checking for duplicate markdown content (by md5)" >&2
find "$ROOT_DIR" -name "*.md" -not -path "*/BACKUP-BEFORE-CLEANUP-*/*" -print0 \
  | xargs -0 md5 -r \
  | sort \
  | awk '{h=$1; f=$2; c[h]++; a[h]=a[h]?a[h]"\n"f:f} END{for(h in c) if(c[h]>1) {print "HASH:",h; print a[h]; print "---"}}'

echo "[2/3] Checking required classification tags" >&2
grep -RLE "^(\[AUTHORITATIVE\]|\[HISTORICAL\]|\[DEPRECATED\])" --include="*.md" "$ROOT_DIR/UYSP Lead Qualification V1/docs" "$ROOT_DIR/UYSP Lead Qualification V1/context" || true

echo "[3/3] Checking Last Updated headers" >&2
grep -RLE "^Last Updated:" --include="*.md" "$ROOT_DIR/UYSP Lead Qualification V1/docs" "$ROOT_DIR/UYSP Lead Qualification V1/context" || true

echo "Done. Review any paths printed above." >&2


