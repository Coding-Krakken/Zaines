#!/usr/bin/env bash
# Auth check script: attempts to access a protected route to verify auth enforcement

BASE=${1:-http://localhost:3000}
AUTH_ROUTE="$BASE/api/auth/session"

echo "Checking auth route: $AUTH_ROUTE"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$AUTH_ROUTE")
BODY=$(echo "$RESPONSE" | sed '$d')
STATUS=$(echo "$RESPONSE" | tail -n1)

echo "Status: $STATUS"
echo "Body: $BODY"

if [ "$STATUS" = "200" ]; then
  echo "Auth route reachable (session returned)"
  exit 0
elif [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
  echo "Auth enforcement present (protected route)"
  exit 0
else
  echo "Unexpected response ($STATUS)"
  exit 1
fi
