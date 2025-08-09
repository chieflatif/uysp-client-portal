#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🧹 Closing session – Step 1/2: Normalize & validate documentation"
bash "$ROOT_DIR/scripts/docs-guard.sh" || {
  echo "❌ Fix the issues above, then re-run:"
  echo "   bash \"$ROOT_DIR/scripts/session-close.sh\""
  exit 1
}

echo "💾 Closing session – Step 2/2: Create backup (if Git is available)"
if git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  bash "$ROOT_DIR/scripts/git-backup.sh"
  echo "✅ Session closed with backup."
else
  echo "ℹ️ Git repository not detected in: $ROOT_DIR"
  echo "   Skipping Git backup. Docs are clean and validated."
fi

echo "🎉 Done. You can now safely end the session."



