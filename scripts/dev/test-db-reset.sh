#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

TEST_DB_URL="${TEST_DATABASE_URL:-postgresql://uysp_test:uysp_test@localhost:6543/uysp_test}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required."
  exit 1
fi

docker compose -f docker-compose.test.yml up -d postgres-test >/dev/null

until docker compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U uysp_test >/dev/null 2>&1; do
  sleep 1
done

echo "Resetting test database..."
docker compose -f docker-compose.test.yml exec -T postgres-test psql -U uysp_test -d postgres <<'SQL'
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='uysp_test';
DROP DATABASE IF EXISTS uysp_test;
CREATE DATABASE uysp_test;
SQL

echo "Running migrations..."
DATABASE_URL="$TEST_DB_URL" DB_SSL_REJECT_UNAUTHORIZED=false npm run db:migrate

echo "Applying schema parity patch..."
psql "$TEST_DB_URL" -f src/lib/db/migrations/0040_schema_parity.sql >/dev/null

