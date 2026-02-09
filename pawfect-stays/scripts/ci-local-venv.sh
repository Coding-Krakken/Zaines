#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Running local CI checks"

echo "-> Install (no-op if node_modules exists)"
pnpm install --silent

echo "-> Typecheck"
pnpm typecheck

echo "-> Lint"
pnpm lint

echo "-> Tests"
pnpm test

echo "-> Build"
pnpm build

echo "==> Local CI checks completed successfully"
