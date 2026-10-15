#!/usr/bin/env bash
# =============================================================================
# Push Test Results to Test_monitor Repository
# Concurrency-safe & Fail-safe protection
# =============================================================================
set -euo pipefail

PROJECT="${1:-arm}"
LAYER="${2:-api}" # web | api | mobile
REPORT_FILE="${3:-reports/report.json}"
MONITOR_REPO="${4:-uoseftalaat/Test_monitor}"
RUN_ID="${GITHUB_RUN_ID:-manual-$(date +%s)}"

# FAIL-SAFE 1: Check if report file exists and has size > 0
if [ ! -f "$REPORT_FILE" ]; then
  echo "⚠️ FAIL-SAFE: Test report not found at '$REPORT_FILE'. Preserving existing dashboard data."
  exit 0
fi

if [ ! -s "$REPORT_FILE" ]; then
  echo "⚠️ FAIL-SAFE: Test report is empty (0 bytes). Preserving existing dashboard data."
  exit 0
fi

# FAIL-SAFE 2: Verify report contains valid JSON before doing any git operations
if ! node -e "JSON.parse(require('fs').readFileSync(process.argv[1]))" "$REPORT_FILE" 2>/dev/null; then
  echo "❌ FAIL-SAFE: Report file contains invalid JSON or is truncated. Preserving existing dashboard data."
  exit 0
fi

if [ -z "${TEST_MONITOR_PAT:-}" ]; then
  echo "⚠️ Warning: TEST_MONITOR_PAT secret is not defined. Skipping push to monitor."
  exit 0
fi

echo "🚀 Preparing to push test results for [${PROJECT} - ${LAYER}] to ${MONITOR_REPO}..."

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Clone Test_monitor with depth 1
if ! git clone --depth 1 "https://x-access-token:${TEST_MONITOR_PAT}@github.com/${MONITOR_REPO}.git" "$TEMP_DIR/monitor"; then
  echo "❌ FAIL-SAFE: Failed to clone ${MONITOR_REPO}. Pipeline will not fail."
  exit 0
fi

# Copy the report file into temp dir
cp "$REPORT_FILE" "$TEMP_DIR/report.json"

# Run ingestion script inside the cloned monitor repo
cd "$TEMP_DIR/monitor"
if ! node scripts/ingest-test-run.js \
  --project "$PROJECT" \
  --layer "$LAYER" \
  --report "$TEMP_DIR/report.json" \
  --run-id "$RUN_ID"; then
  echo "❌ FAIL-SAFE: Ingestion script failed. Aborting commit to prevent data corruption."
  exit 0
fi

# Stage only this layer's file and project manifest
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git add public/data/projects/"${PROJECT}"/"${LAYER}".json \
        public/data/projects/"${PROJECT}"/manifest.json \
        public/data/projects-summary.json 2>/dev/null || true

if git diff --staged --quiet; then
  echo "ℹ️ No changes in test data. Skipping commit."
else
  git commit -m "chore(qa): update ${PROJECT} [${LAYER}] test results [run: ${RUN_ID}]"
  
  # Concurrency protection with automatic rebase
  MAX_RETRIES=3
  RETRY_COUNT=0
  SUCCESS=false

  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if git pull --rebase origin main && git push origin main; then
      SUCCESS=true
      break
    else
      echo "⚠️ Concurrent push detected. Retrying rebase ($((RETRY_COUNT + 1))/$MAX_RETRIES)..."
      git rebase --abort 2>/dev/null || true
      sleep $((RANDOM % 3 + 1))
      RETRY_COUNT=$((RETRY_COUNT + 1))
    fi
  done

  if [ "$SUCCESS" = true ]; then
    echo "✅ Successfully pushed ${PROJECT} [${LAYER}] test results to ${MONITOR_REPO}!"
  else
    echo "⚠️ Warning: Could not push results after $MAX_RETRIES attempts due to concurrent updates."
  fi
fi
