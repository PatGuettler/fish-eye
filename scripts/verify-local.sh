#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== node =="
node -v
npm -v

echo "== fixtures =="
test -f f1040sc.pdf || { echo "Missing f1040sc.pdf"; exit 1; }
test -f schedulC.jpg || { echo "Missing schedulC.jpg"; exit 1; }

echo "== build =="
npm run build

echo "== tests =="
npm test

echo "== dev smoke (5s) =="
npm run dev > /tmp/fish-eye-vite.log 2>&1 &
pid=$!
sleep 4
if curl -sf -o /dev/null http://127.0.0.1:5173/; then
  echo "Dev server OK: http://localhost:5173/"
else
  echo "Dev server did not respond on :5173"
  head -20 /tmp/fish-eye-vite.log
  kill "$pid" 2>/dev/null || true
  exit 1
fi
kill "$pid" 2>/dev/null || true

echo "All checks passed."
