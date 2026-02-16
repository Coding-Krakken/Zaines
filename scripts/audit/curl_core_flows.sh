#!/usr/bin/env bash
# Core flow checks: booking create (POST /api/bookings) and payment intent creation

BASE=${1:-http://localhost:3000}

echo "Running core flow checks against $BASE"

# 1) Availability (GET /api/availability)
echo "- Checking availability route"
curl -s -o /dev/null -w "availability:%{http_code}\n" "$BASE/api/availability"

# 2) Create booking (POST /api/bookings) with minimal payload
echo "- Attempting to create a booking (dry-run)"
BOOKING_PAYLOAD='{
  "checkIn": "2026-07-01",
  "checkOut": "2026-07-02",
  "suiteType": "standard",
  "petCount": 1,
  "firstName": "Audit",
  "lastName": "User",
  "email": "audit@example.com"
}'

echo "$BOOKING_PAYLOAD" | curl -s -w "\ncreate_booking_status:%{http_code}\n" -H "Content-Type: application/json" -d @- "$BASE/api/bookings"

# 3) Payment intent (POST /api/payments/create-intent) if Stripe configured
echo "- Attempting payment intent creation (may fail if Stripe not configured)"
PAYMENT_PAYLOAD='{"amount":100,"currency":"usd","bookingId":"audit-booking"}'
echo "$PAYMENT_PAYLOAD" | curl -s -w "\ncreate_payment_status:%{http_code}\n" -H "Content-Type: application/json" -d @- "$BASE/api/payments/create-intent"

echo "Core flow checks complete"
