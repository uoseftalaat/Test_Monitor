#!/usr/bin/env bash
# =============================================================================
# Push Test Results to Test_monitor Repository
# Concurrency-safe for Web, API, and Mobile independent pipelines.
# =============================================================================
set -euo pipefail

PROJECT="${1:-arm}"
LAYER="${2:-api}" # web | api | mobile
REPORT_FILE="${3:-reports/report.json}"
MONITOR_REPO="${4:-uoseftalaat/Test_monitor}"
RUN_ID="${GITHUB_RUN_ID:-manual-$(date +%s)}"

if [ ! -f "$REPORT_FILE" ]; then
  echo "⚠️ Warning: Test report not found at $REPORT_FILE. Skipping push to monitor."
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
git clone --depth 1 "https://x-access-token:${TEST_MONITOR_PAT}@github.com/${MONITOR_REPO}.git" "$TEMP_DIR/monitor"

# Copy the report file
cp "$REPORT_FILE" "$TEMP_DIR/report.json"

# Run ingestion script inside the cloned monitor repo
cd "$TEMP_DIR/monitor"
node scripts/ingest-test-run.js \
  --project "$PROJECT" \
  --layer "$LAYER" \
  --report "$TEMP_DIR/report.json" \
  --run-id "$RUN_ID"

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
  
  # Concurrency protection: Pull latest commits before pushing so concurrent pipelines never fail
  git pull --rebase origin main || git rebase --abort
  git push origin main
  echo "✅ Successfully pushed ${PROJECT} [${LAYER}] test results to ${MONITOR_REPO}!"
fi
