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
- **Cloud-Native Realtime Architecture**:
  - Live real-time dashboard updates via **Firebase Firestore** `onSnapshot`.
  - Offline Playwright `.zip` archives hosted securely on **Firebase Storage**.
  - Frontend hosted serverlessly on **GitHub Pages**.
  - Direct pipeline push via `scripts/push-to-firebase.js` in ~300ms with **zero Git merge conflicts**.
  - Local fallback preview mode supported when offline or without Firebase credentials.

---

## Project Structure

```
Test_monitor/
├── .github/
│   └── workflows/
│       └── deploy.yml                  # Automatic GitHub Pages build & deploy
├── public/
│   ├── data/
│   │   ├── projects-summary.json       # Offline fallback summary
│   │   └── projects/                   # Offline fallback project data (zeros)
│   └── favicon.svg
├── scripts/
│   ├── push-to-firebase.js             # CI test results & zip report push to Firestore/Storage
│   ├── reset-all-data.js               # Administrative script to reset all data to clean zeros
│   └── migrate-local-data-to-firebase.js # Seeds Firestore from local fallback templates
├── src/
│   ├── constants/                      # Centralized constants & configs
│   │   ├── layers.js                   # Web, API, Mobile layers metadata & icons
│   │   ├── status.js                   # Status priorities, styles, and configs
│   │   └── projects.js                 # Default project registry
│   ├── hooks/                          # Custom React hooks
│   │   ├── useAuth.js                  # Authentication lifecycle hook
│   │   └── useProjectData.js           # Realtime Firestore sync & fallback hook
│   ├── utils/                          # Pure utilities
│   │   ├── cn.js                       # clsx + twMerge utility
│   │   ├── ansi.js                     # ANSI escape stripper & tokenizer
│   │   └── formatters.js               # Byte, time, and duration formatters
│   ├── components/
│   │   ├── common/                     # Reusable UI primitives (AnsiText, MetricCard, StatusBadge)
│   │   ├── layout/                     # Navbar, Footer
│   │   ├── auth/                       # AuthModal
│   │   ├── overview/                   # GlobalOverview, ProjectCard
│   │   ├── project/                    # ProjectView, Header, Kpis, Tabs, ZipBanner, Failures, Filters, Table
│   │   └── TestDetailModal.jsx         # Diagnostic stack trace & history inspector
│   ├── firebase/                       # Firebase configuration & services
│   ├── App.jsx                         # Main container
│   ├── index.css
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

## Firebase Setup & Authentication

TestMonitor is connected to Firebase project **[`test-monitor-46836`](https://console.firebase.google.com/u/1/project/test-monitor-46836/overview)**.

### 1. Enable Firebase Services in Console
1. **Authentication**:
   - Go to **Build > Authentication > Sign-in method**.
   - Enable **Email/Password** (Email link and Google SSO can remain disabled).
   - In **Users**, click **Add user** to manually provision authorized QA and engineering accounts. (Self-registration is disabled for maximum security).
2. **Firestore Database**:
   - Go to **Build > Firestore Database > Create database**.
   - Paste the rules from [`firestore.rules`](file:///home/uoseftalaat/Projects/Test_monitor/firestore.rules).
3. **Storage (Optional for Playwright Zip Uploads)**:
   - Go to **Build > Storage > Get Started** (Free Spark tier bucket).
4. **Register Web App**:
   - Go to **Project Settings > General > Your apps > Web app** (`</>`).
   - Copy the configuration keys into your local `.env.local` file (see `.env.example`).

### 2. Reset or Seed Test Data
To reset all projects and layers to clean zero metrics:
```bash
# Provide service account key via env var or service-account.json
node scripts/reset-all-data.js
```

---

## Connecting Your CI Test Pipeline (Direct Firebase Push)

Instead of slow Git commits, pipelines push test results directly to Firestore in **~300ms** with zero merge conflicts, and automatically link interactive Playwright zip reports for offline analysis.

### Step 1: Create a Service Account Key
1. In Firebase Console, go to **Project Settings > Service accounts**.
2. Click **Generate new private key** and download the JSON.
3. In your QA repository (e.g. `arm_test`), go to **Settings > Secrets > Actions**.
4. Add a secret named `FIREBASE_SERVICE_ACCOUNT` and paste the entire JSON content.

### Step 2: Add Push Step in GitHub Actions Workflow
In your test workflow (e.g., `test-stages.yml`), after Playwright or Mobile tests finish:

```yaml
      - name: Push Results & Playwright Reports to Firebase
        if: ${{ !cancelled() }}
        env:
          FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
        run: |
          REPORT_FILE="${{ inputs.qaRepoDir }}/${{ inputs.automationDir }}/reports/results.json"
          ZIP_FILE="${{ inputs.qaRepoDir }}/${{ inputs.automationDir }}/playwright-report.zip"
          
          # Compress Playwright HTML report into a zip archive
          cd "${{ inputs.qaRepoDir }}/${{ inputs.automationDir }}"
          zip -r playwright-report.zip playwright-report/ || true
          cd -
          
          # Download and execute Firebase push script
          curl -sSL https://raw.githubusercontent.com/uoseftalaat/Test_monitor/main/scripts/push-to-firebase.js -o push-to-firebase.js
          
          node push-to-firebase.js \
            --project "${{ inputs.apps }}" \
            --layer "${{ inputs.testLayer }}" \
            --report "$REPORT_FILE" \
            --zip-report "$ZIP_FILE" \
            --run-id "${{ github.run_id }}"
```

> **Note for Old School Testers**: Uploading the `.zip` report allows QA testers to download the complete standalone Playwright HTML report package directly from the dashboard under each project's Web, API, or Mobile status page. Testers can extract the zip file and inspect network calls, video recordings, and step-by-step traces completely offline without needing CI access.

---

## Local Development

```bash
# Install dependencies
npm install

# Start local preview
npm run dev

# Reset all metrics and test data to clean zeros (Local & Firestore)
npm run reset:data

# Push test results to Firebase Firestore & Storage
npm run push:firebase -- --help

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
