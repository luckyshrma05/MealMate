#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:5001}"
for endpoint in /api/health /api/db-health; do
  status=$(curl --silent --output /dev/null --write-out '%{http_code}' "$BASE_URL$endpoint")
  echo "$endpoint: HTTP $status"
  test "$status" = 200 || { echo "FAIL: $endpoint"; exit 1; }
done
status=$(curl --silent --output /dev/null --write-out '%{http_code}' "$BASE_URL/api/events")
echo "/api/events (without JWT): HTTP $status"
test "$status" = 401 || { echo "FAIL: expected authentication protection"; exit 1; }
echo "PASS: health, database and authentication gate HTTP checks."
