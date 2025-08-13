#!/usr/bin/env bash
set -euo pipefail

# Usage: bash scripts/add-doc-headers.sh 2025-08-08
DATE_HEADER=${1:-$(date +%F)}

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

AUTHORITATIVE_DIRS=(
  "$ROOT_DIR/docs/CURRENT"
  "$ROOT_DIR/docs/PROCESS"
  "$ROOT_DIR/docs/ARCHITECTURE"
  "$ROOT_DIR/docs/agents"
  "$ROOT_DIR/context/CURRENT-SESSION"
)

HISTORICAL_DIRS=(
  "$ROOT_DIR/docs/archive"
  "$ROOT_DIR/context/SESSIONS-ARCHIVE"
)

prepend_header_if_missing() {
  local file="$1"; shift
  local tag="$1"; shift
  local date_val="$1"; shift

  # If file already has any classification tag in the first 5 lines, skip
  if head -n 5 "$file" | grep -Eq '^\[(AUTHORITATIVE|HISTORICAL|DEPRECATED)\]'; then
    return 0
  fi

  local tmp
  tmp="$(mktemp)"
  {
    printf '%s\n' "[$tag]"
    printf 'Last Updated: %s\n\n' "$date_val"
    cat "$file"
  } > "$tmp"
  mv "$tmp" "$file"
  echo "Added [$tag] header → $file"
}

export -f prepend_header_if_missing

echo "Adding [AUTHORITATIVE] headers... (date: $DATE_HEADER)" >&2
for dir in "${AUTHORITATIVE_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    find "$dir" -type f -name "*.md" \
      -not -path "*/BACKUP-BEFORE-CLEANUP-*/*" -print0 | \
      xargs -0 -I{} bash -c 'prepend_header_if_missing "$0" AUTHORITATIVE "$1"' {} "$DATE_HEADER"
  fi
done

echo "Adding [HISTORICAL] headers... (date: $DATE_HEADER)" >&2
for dir in "${HISTORICAL_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    find "$dir" -type f -name "*.md" \
      -not -path "*/BACKUP-BEFORE-CLEANUP-*/*" -print0 | \
      xargs -0 -I{} bash -c 'prepend_header_if_missing "$0" HISTORICAL "$1"' {} "$DATE_HEADER"
  fi
done

echo "Done." >&2



