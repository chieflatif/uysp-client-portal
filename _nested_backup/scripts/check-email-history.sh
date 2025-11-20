#!/bin/bash

###############################################################################
# CHECK EMAIL SEND HISTORY
#
# Purpose: Query email audit log to see what emails have been sent
# Usage: ./scripts/check-email-history.sh [filter]
#
# Examples:
#   ./scripts/check-email-history.sh                    # Show all recent emails
#   ./scripts/check-email-history.sh weekly_report      # Show only weekly reports
#   ./scripts/check-email-history.sh user@example.com   # Show emails to specific recipient
###############################################################################

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL not set${NC}"
  echo "Export it: export DATABASE_URL='your-db-url'"
  exit 1
fi

FILTER=${1:-}

echo -e "${BLUE}=============================================="
echo "📧 EMAIL AUDIT LOG"
echo "==============================================\n${NC}"

if [ -z "$FILTER" ]; then
  echo "Showing last 20 emails sent:"
  echo ""
  psql "$DATABASE_URL" -c "
    SELECT
      sent_at,
      email_type,
      recipient,
      subject,
      status
    FROM email_audit_log
    ORDER BY sent_at DESC
    LIMIT 20;
  "
else
  echo "Filtering for: $FILTER"
  echo ""
  psql "$DATABASE_URL" -c "
    SELECT
      sent_at,
      email_type,
      recipient,
      subject,
      status,
      error_message
    FROM email_audit_log
    WHERE
      email_type LIKE '%$FILTER%' OR
      recipient LIKE '%$FILTER%' OR
      subject LIKE '%$FILTER%'
    ORDER BY sent_at DESC
    LIMIT 20;
  "
fi

echo ""
echo -e "${BLUE}Summary:${NC}"

# Count by type
echo ""
echo "By Email Type:"
psql "$DATABASE_URL" -t -c "
  SELECT
    email_type,
    COUNT(*) as count
  FROM email_audit_log
  GROUP BY email_type
  ORDER BY count DESC;
"

# Count by status
echo ""
echo "By Status:"
psql "$DATABASE_URL" -t -c "
  SELECT
    status,
    COUNT(*) as count
  FROM email_audit_log
  GROUP BY status;
"

# Recent failures
FAILED_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM email_audit_log WHERE status = 'failed';" | tr -d ' ')

if [ "$FAILED_COUNT" -gt 0 ]; then
  echo ""
  echo -e "${RED}⚠️  $FAILED_COUNT failed email(s) found${NC}"
  echo ""
  echo "Recent failures:"
  psql "$DATABASE_URL" -c "
    SELECT
      sent_at,
      email_type,
      recipient,
      error_message
    FROM email_audit_log
    WHERE status = 'failed'
    ORDER BY sent_at DESC
    LIMIT 5;
  "
fi

echo ""
echo -e "${GREEN}✅ Email audit log checked${NC}"
