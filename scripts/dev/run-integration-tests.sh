#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE_OVERRIDE:-.env.test}"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

export TEST_DATABASE_URL="${TEST_DATABASE_URL:-postgresql://uysp_test:uysp_test@localhost:6543/uysp_test?sslmode=disable}"

if [[ "$TEST_DATABASE_URL" == *"render.com"* ]]; then
  echo "Refusing to run integration tests against a production/shared database."
  exit 1
fi

DATABASE_URL="$TEST_DATABASE_URL" DB_SSL_REJECT_UNAUTHORIZED=false npm run test:integration:raw

