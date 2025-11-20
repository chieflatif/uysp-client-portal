#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

docker compose -f docker-compose.test.yml up -d postgres-test

CONTAINER_ID="$(docker compose -f docker-compose.test.yml ps -q postgres-test)"

echo "Waiting for postgres-test to accept connections..."
until docker exec "$CONTAINER_ID" pg_isready -U uysp_test >/dev/null 2>&1; do
  sleep 1
done

echo "postgres-test is ready on localhost:6543"

