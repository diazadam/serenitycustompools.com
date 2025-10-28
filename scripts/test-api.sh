#!/bin/bash
# Quick API test script for Serenity Custom Pools

# Load API key from config
source ../configs/api-key.txt

if [ "$API_KEY" = "PENDING" ]; then
    echo "Error: API key not set in configs/api-key.txt"
    exit 1
fi

# Test endpoint (modify as needed)
ENDPOINT="${1:-/api/health}"

echo "Testing: $BASE_URL$ENDPOINT"
echo "Using API Key: ${API_KEY:0:10}..."
echo ""

curl -X GET "$BASE_URL$ENDPOINT" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -w "\n\nStatus: %{http_code}\n"
