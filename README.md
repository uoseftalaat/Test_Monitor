# TestMonitor — Centralized QA Test Monitoring Dashboard

A fast, serverless, automated QA test monitoring website hosted on **GitHub Pages**. Designed to replace the need for QA engineers and testers to dig through raw pipeline logs and CI artifacts.

---

## Key Features

- **Scalable Multi-Project Support**:
  - Out of the box tabs for **ARM (`arm_test`)**, **Cadaa**, **Kuiper**, and **Atlas**.
  - **Executive Overview**: Cross-project summary with pass rates, active failure counts, and health statuses.
  - Adding future projects is 100% dynamic without modifying UI code.
- **Layer & Platform Coverage**:
  - 🌐 **Web**
  - ⚡ **API**
  - 📱 **Mobile — Android**
  - 🍏 **Mobile — iOS**
- **Complete Pipeline Log Replacement**:
  - **Exact Failure Reason**: Clean, highlighted diagnostic banner (e.g. `TimeoutError`, `AssertionError`, `500 Internal Server Error`).
  - **Failing Step / Action**: Pinpoints the exact line/action Playwright was executing when it failed.
  - **Syntax-Highlighted Stack Trace**: Full trace viewer with 1-click clipboard copy.
  - **No CI Login Required**: Testers inspect failures directly on the website without needing access to GitHub Actions execution logs.
- **30-Day Rolling Failure & Regression History**:
  - Day-by-day pass/fail status bars for each test case over the past month.
  - Detailed audit table: Date, Run ID, Status, Duration, and Error Reason for every failure in the last 30 days.
  - Auto-pruning keeps JSON files fast and lightweight.
- **GitOps Architecture (Zero Server Costs)**:
  - Frontend hosted on **GitHub Pages**.
  - Data stored directly in `public/data/projects/{projectId}.json`.
  - **Decoupled Data Files**: Each project has its own JSON file—pipelines for ARM, Cadaa, etc. update independently with **zero Git merge conflicts**.
  - GitHub Actions automatically commits and redeploys the site in ~30 seconds.

---

## Project Structure

```
Test_monitor/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Automatic GitHub Pages build & deploy on push
├── public/
│   ├── data/
│   │   ├── projects-summary.json   # Executive high-level summary of all projects
│   │   └── projects/
│   │       ├── arm.json            # ARM test results & 30-day history
│   │       ├── cadaa.json          # Cadaa test results & 30-day history
│   │       ├── kuiper.json         # Kuiper test results & 30-day history
│   │       └── atlas.json          # Atlas test results & 30-day history
│   └── favicon.svg
├── scripts/
│   ├── generate-data.js            # Seeds realistic sample 30-day test data
│   ├── ingest-test-run.js          # Ingests Playwright / Mobile test JSON reports
│   └── push-results-to-monitor.sh  # Script run by CI to auto-commit test runs
├── src/
│   ├── components/
│   │   ├── GlobalOverview.jsx      # All-projects executive dashboard
│   │   ├── Navbar.jsx              # Project tabs, health badges, auto-refresh
│   │   ├── ProjectView.jsx         # Layer tabs, 30-day trend chart, test table
│   │   └── TestDetailModal.jsx     # Failure analysis & stack trace inspector
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

## Connecting Your Test Pipeline (e.g. `arm_test`)

### Step 1: Create a Personal Access Token (PAT)
1. In your GitHub account, go to **Settings > Developer Settings > Personal Access Tokens > Fine-grained tokens** (or Tokens Classic).
2. Generate a token with **Contents: Read and write** permissions on the `Test_monitor` repository.
3. In `arm_test` (or your org repo), go to **Settings > Secrets and variables > Actions**.
4. Add a secret named `TEST_MONITOR_PAT` and paste your token value.

### Step 2: Add Reporting Step to `arm_test/.github/workflows/test-stages.yml`

In `arm_test/.github/workflows/test-stages.yml`, ensure Playwright runs with the JSON reporter alongside list and HTML:

```yaml
      - name: Run ${{ inputs.testLayer }} tests (${{ inputs.apps }})
        working-directory: ${{ inputs.qaRepoDir }}/${{ inputs.automationDir }}
        run: |
          ...
          npx playwright test $PROJECT_ARG "${SELECT_ARGS[@]}" \
            --reporter=list,html,json \
            PLAYWRIGHT_JSON_OUTPUT_NAME=reports/results.json
```

Then right after tests run, add the step to automatically update `Test_monitor`:

```yaml
      - name: Push Results to Test Monitor
        if: ${{ !cancelled() }}
        env:
          TEST_MONITOR_PAT: ${{ secrets.TEST_MONITOR_PAT }}
        run: |
          REPORT_FILE="${{ inputs.qaRepoDir }}/${{ inputs.automationDir }}/reports/results.json"
          
          # Clone push script and execute
          curl -sSL https://raw.githubusercontent.com/uoseftalaat/Test_monitor/main/scripts/push-results-to-monitor.sh -o push-monitor.sh
          chmod +x push-monitor.sh
          
          ./push-monitor.sh \
            "${{ inputs.apps }}" \
            "${{ inputs.testLayer }}" \
            "$REPORT_FILE" \
            "uoseftalaat/Test_monitor"
```

**Result**: Every pipeline run commits directly to `Test_monitor`'s `main` branch. No PR or manual approval is needed, and GitHub Pages refreshes with the latest metrics within 30 seconds!

---

## Local Development

```bash
# Install dependencies
npm install

# Start local preview
npm run dev

# Regenerate sample 30-day data
node scripts/generate-data.js

# Build production bundle for GitHub Pages
npm run build
```

---

## GitHub Pages Deployment Setup

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial test monitor dashboard"
   git remote add origin https://github.com/uoseftalaat/Test_monitor.git
   git branch -M main
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings > Pages**.
   - Under **Build and deployment > Source**, choose **GitHub Actions**.
3. Every time code or test results are pushed to `main`, GitHub Actions will automatically deploy the site!
