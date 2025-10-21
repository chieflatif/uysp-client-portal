#!/bin/bash
# Simple sync script for UYSP

UYSP_CLIENT_ID="6a08f898-19cd-49f8-bd77-6fcb2dd56db9"

echo "🔄 Running UYSP sync..."
echo "Client ID: $UYSP_CLIENT_ID"
echo ""

# Wait for server
sleep 3

# Call the sync API (will need manual trigger from browser since auth required)
echo "⚠️  You need to trigger the sync from the browser:"
echo ""
echo "1. Go to http://localhost:3007/admin"
echo "2. Open browser console (F12)"
echo "3. Run this command:"
echo ""
echo "fetch('/api/admin/sync', {"
echo "  method: 'POST',"
echo "  headers: {'Content-Type': 'application/json'},"
echo "  body: JSON.stringify({clientId: '$UYSP_CLIENT_ID'})"
echo "}).then(r => r.json()).then(console.log)"
echo ""
echo "This will sync all 11,046 UYSP leads from Airtable"


