#!/usr/bin/env bash
set -euo pipefail

# Simple markdown link checker for relative file links
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

grep -RIn --include="*.md" -E "\\]\([^)]*\\)" "$ROOT_DIR" | while IFS= read -r line; do
  file="${line%%:*}"
  rest="${line#*:}"
  lineno="${rest%%:*}"
  content="${rest#*:}"
  # Extract all markdown links in the line
  while [[ "$content" =~ \]\(([^)]*)\) ]]; do
    full="${BASH_REMATCH[0]}"
    link="${BASH_REMATCH[1]}"
    content="${content#*"$full"}"
    # Only check relative links (no http/https/mailto/# anchors)
    if [[ "$link" =~ ^(http|https|mailto|#) ]]; then
      continue
    fi
    # Resolve path relative to file
    base_dir="$(dirname "$file")"
    target="$base_dir/$link"
    # Normalize .. and . via realpath if available
    if command -v realpath >/dev/null 2>&1; then
      target="$(realpath -m "$target" 2>/dev/null || echo "$target")"
    fi
    if [ ! -e "$target" ]; then
      echo "BROKEN: $file:$lineno -> $link"
    fi
  done
done

echo "Done."


