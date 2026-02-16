#!/usr/bin/env bash
# Lightweight UI route checker: fetches pages and reports HTTP status, title, main presence, and form presence.
BASE=${1:-http://localhost:3000}

ROUTES=(
  "/"
  "/about"
  "/contact"
  "/book"
  "/dog"
  "/dog/calm"
  "/faq"
  "/gallery"
  "/policies"
  "/pricing"
  "/privacy"
  "/reviews"
  "/services/boarding"
  "/services/daycare"
  "/services/grooming"
  "/services/training"
  "/suites"
  "/auth/signin"
)

echo "Starting UI route checks against $BASE"

for route in "${ROUTES[@]}"; do
  url="$BASE${route}"
  echo "\n- Checking: $url"
  resp=$(curl -s -L -w "\n--STATUS:%{http_code}\n--LENGTH:%{size_download}\n" "$url")
  status=$(echo "$resp" | awk -F"--STATUS:" '{print $2}' | tr -d '\r' | sed -n '1p')
  length=$(echo "$resp" | awk -F"--LENGTH:" '{print $2}' | tr -d '\r' | sed -n '1p')
  body=$(echo "$resp" | sed -n '1,/<--STATUS:/p')

  echo "  HTTP: ${status:-000}  Length: ${length:-0}"
  if [[ "$status" =~ ^2|3 ]]; then
    echo "  OK: page served"
  else
    echo "  FAIL: non-2xx/3xx status"
  fi

  # Basic HTML checks
  if echo "$body" | grep -iq "<title"; then
    title=$(echo "$body" | sed -n '1,200p' | grep -i -m1 "<title" | sed -E 's/.*<title[^>]*>(.*)<\/title>.*/\1/I')
    echo "  Title: ${title:-(found)}"
  else
    echo "  Title: MISSING"
  fi

  if echo "$body" | grep -iq "<main"; then
    echo "  Main: present"
  else
    echo "  Main: MISSING"
  fi

  if echo "$body" | grep -iq "<form"; then
    echo "  Form: present"
  else
    echo "  Form: none"
  fi

done

echo "\nUI route checks complete"
