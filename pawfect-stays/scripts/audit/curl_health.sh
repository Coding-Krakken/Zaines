#!/usr/bin/env bash
# Simple health check for local dev server
URL=${1:-http://localhost:3000}

echo "Checking server health at $URL"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo "000")
if [ "$HTTP_STATUS" = "000" ]; then
  echo "Server not reachable at $URL"
  exit 2
fi

echo "HTTP status: $HTTP_STATUS"
if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 400 ]; then
  echo "OK: Server reachable"
  exit 0
else
  echo "WARN: Received non-2xx/3xx response"
  exit 1
fi
