#!/bin/bash

# List of required environment variables
VARS=(
  AIRTABLE_BASE_ID
  CACHE_EXPIRY_DAYS
  BATCH_SIZE
  DAILY_COST_LIMIT
  TEST_MODE
  MAX_RETRIES
  RETRY_DELAY_MS
  TEN_DLC_REGISTERED
  SMS_MONTHLY_LIMIT
)

MISSING=0

for VAR in "${VARS[@]}"; do
  VALUE=$(printenv "$VAR")
  if [ -z "$VALUE" ]; then
    echo "[MISSING] $VAR is not set."
    MISSING=1
  else
    echo "[OK] $VAR=$VALUE"
  fi
done

if [ $MISSING -eq 0 ]; then
  echo "All required environment variables are set."
  exit 0
else
  echo "Some required environment variables are missing."
  exit 1
fi 