#!/bin/bash

# Test Recall.ai with a Google Meet link
# Usage: ./test-recall.sh https://meet.google.com/abc-defg-hij

MEETING_URL="$1"
API_KEY="6db84e8ce832506dbef532c81e85bd1fe290ce17"

if [ -z "$MEETING_URL" ]; then
    echo "Usage: ./test-recall.sh <google-meet-link>"
    exit 1
fi

echo "🎙️ Starting Recall.ai bot for meeting: $MEETING_URL"

curl -X POST https://us-west-2.recall.ai/api/v1/bot \
  -H "Authorization: Token $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"meeting_url\": \"$MEETING_URL\",
    \"bot_name\": \"UYSP Recorder\",
    \"transcription_options\": {
      \"provider\": \"assembly_ai\"
    }
  }"

echo ""
echo "✅ Bot sent to meeting!"
echo "Check the Recall.ai dashboard to see it join."

