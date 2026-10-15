import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../public/data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');

if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

// Generate dates for the past 30 days
function getPast30Days() {
  const dates = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

const dates30d = getPast30Days();

function generateTestHistory(testId, layer, baseStatus, failureProfile) {
  // failureProfile: 'always-pass', 'flaky', 'recent-fail', 'intermittent'
  return dates30d.map((date, idx) => {
    let status = 'passed';
    let error = null;

    if (failureProfile === 'recent-fail' && idx >= 27) {
      status = 'failed';
      error = failureProfile.error || 'Server error 500';
    } else if (failureProfile === 'flaky' && (idx % 4 === 0 || idx === 29)) {
      status = 'flaky';
      error = 'Transient timeout: locator.waitFor exceeded 30000ms';
    } else if (failureProfile === 'intermittent' && (idx === 10 || idx === 18 || idx === 28)) {
      status = 'failed';
      error = 'AssertionError: Received 502 Bad Gateway';
    } else if (failureProfile === 'skipped') {
      status = 'skipped';
    }

    return {
      date,
      runId: `run-${date.replace(/-/g, '')}-${layer.slice(0, 3)}`,
      status,
      durationMs: Math.floor(Math.random() * 2500) + 300,
      ...(error ? { error } : {})
    };
  });
}

const projects = [
  {
    id: 'arm',
    name: 'ARM',
    description: 'Asset & Resource Management Platform',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/arm_test',
    layers: {
      web: [
        {
          id: 'arm-web-invoice-create',
          suite: 'Invoices & Billing',
          title: 'Should create lump-sum invoice and calculate tax correctly',
          file: 'tests/web/invoices/lump-sum-invoices.spec.ts',
          profile: 'always-pass',
          durationMs: 4200
        },
        {
          id: 'arm-web-invoice-filter',
          suite: 'Invoices & Billing',
          title: 'Should filter invoices by customer, date range, and status',
          file: 'tests/web/invoices/filter-invoices.spec.ts',
          profile: 'recent-fail',
          error: {
            message: 'TimeoutError: locator.waitFor: Timeout 30000ms exceeded waiting for locator(".invoice-table-row")',
            stack: 'TimeoutError: locator.waitFor: Timeout 30000ms exceeded\n    at InvoicePage.waitForInvoices (src/pages/invoice.page.ts:84:16)\n    at tests/web/invoices/filter-invoices.spec.ts:32:9',
            step: 'await page.locator(".invoice-table-row").first().waitFor({ state: "visible" })'
          },
          durationMs: 31200
        },
        {
          id: 'arm-web-user-roles',
          suite: 'User Roles & Permissions',
          title: 'Manager role should be able to approve pending estimation requests',
          file: 'tests/web/roles/user-roles.spec.ts',
          profile: 'always-pass',
          durationMs: 3800
        },
        {
          id: 'arm-web-estimation-edit',
          suite: 'Project Estimations',
          title: 'Should update line-item budget in active estimation draft',
          file: 'tests/web/estimations/estimation-edit.spec.ts',
          profile: 'flaky',
          error: {
            message: 'TargetClosedError: Target page, context or browser has been closed',
            stack: 'TargetClosedError: Target page closed\n    at tests/web/estimations/estimation-edit.spec.ts:67:12',
            step: 'await page.locator("button#save-draft").click()'
          },
          durationMs: 5100
        },
        {
          id: 'arm-web-account-creation',
          suite: 'Account Management',
          title: 'Happy path: create corporate customer account with dual currency',
          file: 'tests/web/accounts/account-creation.spec.ts',
          profile: 'always-pass',
          durationMs: 4900
        },
        {
          id: 'arm-web-project-report',
          suite: 'Reports & Analytics',
          title: 'Export per-employee per-project timesheet breakdown to PDF and XLSX',
          file: 'tests/web/reports/per-employee-project-report.spec.ts',
          profile: 'always-pass',
          durationMs: 6200
        }
      ],
      api: [
        {
          id: 'arm-api-encryption-keys',
          suite: 'Security & Encryption',
          title: 'POST /api/v1/keys/rotate - singleton encryption key rotation with rollback',
          file: 'tests/api/common/encryption.spec.ts',
          profile: 'always-pass',
          durationMs: 850
        },
        {
          id: 'arm-api-project-settings',
          suite: 'Project Management',
          title: 'PATCH /api/v1/projects/:id/settings - global project settings update',
          file: 'tests/api/project_management/project-settings.spec.ts',
          profile: 'recent-fail',
          error: {
            message: 'AssertionError: Expected 200 OK but received 500 Internal Server Error: "Deadlock detected on table project_meta_tbl"',
            stack: 'Error: Expected 200 OK but received 500\n    at sendRequest (tests_support/core/api-client.ts:62:15)\n    at tests/api/project_management/project-settings.spec.ts:44:9',
            step: 'await apiClient.patch("/api/v1/projects/PRJ-904/settings", payload)'
          },
          durationMs: 1250
        },
        {
          id: 'arm-api-estimation-settings',
          suite: 'Project Management',
          title: 'POST /api/v1/estimations/tax-matrix - update global tax tiers',
          file: 'tests/api/project_management/estimation-settings-global.spec.ts',
          profile: 'always-pass',
          durationMs: 910
        },
        {
          id: 'arm-api-filtered-accounts',
          suite: 'Account API',
          title: 'GET /api/v1/accounts?status=active&sort=balance:desc - pagination and sorting',
          file: 'tests/api/accounts/filtered-sorted-accounts.spec.ts',
          profile: 'always-pass',
          durationMs: 430
        },
        {
          id: 'arm-api-assigned-variables',
          suite: 'Variables API',
          title: 'POST /api/v1/variables/assign - slot validation with 20 slots limit',
          file: 'tests/api/variables/assigned-variables.spec.ts',
          profile: 'flaky',
          error: {
            message: 'AssertionError: Expected array length <= 20 but received 21 slots allocated',
            stack: 'Error: Max slots invariant violated\n    at tests/api/variables/assigned-variables.spec.ts:38:20',
            step: 'expect(assignedSlots.length).toBeLessThanOrEqual(20)'
          },
          durationMs: 780
        }
      ],
      android: [
        {
          id: 'arm-android-login-biometric',
          suite: 'Authentication',
          title: 'Biometric fingerprint login on Android 14 Emulators',
          file: 'android/tests/auth/BiometricLoginTest.kt',
          profile: 'always-pass',
          durationMs: 8200
        },
        {
          id: 'arm-android-project-sync',
          suite: 'Offline Data Sync',
          title: 'Sync offline task updates with exponential backoff upon network restoration',
          file: 'android/tests/sync/OfflineSyncTest.kt',
          profile: 'intermittent',
          error: {
            message: 'RoomDbException: Migration missing from version 14 to 15 on SQLite database',
            stack: 'RoomDbException: Migration failed\n    at com.areeb.arm.db.AppDatabase.migrate(AppDatabase.kt:56)\n    at android/tests/sync/OfflineSyncTest.kt:41',
            step: 'database.syncWorker.doWork()'
          },
          durationMs: 14200
        },
        {
          id: 'arm-android-receipt-upload',
          suite: 'Expenses',
          title: 'Capture expense receipt image and attach to active invoice draft',
          file: 'android/tests/expenses/ReceiptUploadTest.kt',
          profile: 'always-pass',
          durationMs: 9400
        }
      ],
      ios: [
        {
          id: 'arm-ios-faceid-auth',
          suite: 'Authentication',
          title: 'FaceID authentication flow on iOS 18 Simulator',
          file: 'ios/Tests/Auth/FaceIDAuthTests.swift',
          profile: 'always-pass',
          durationMs: 7100
        },
        {
          id: 'arm-ios-push-notification',
          suite: 'Notifications',
          title: 'Receive APNS background notification and route to project details screen',
          file: 'ios/Tests/Push/PushRoutingTests.swift',
          profile: 'recent-fail',
          error: {
            message: 'XCTestCaseFailure: Expected viewController to be ProjectDetailViewController, found DashboardViewController',
            stack: 'XCTestCaseFailure: Navigation hierarchy mismatched\n    at PushRoutingTests.swift:78\n    at XCTestRunner.run()',
            step: 'XCTAssertTrue(currentVC is ProjectDetailViewController)'
          },
          durationMs: 8900
        },
        {
          id: 'arm-ios-invoice-review',
          suite: 'Invoices',
          title: 'Review invoice summary and export signed PDF copy to Files app',
          file: 'ios/Tests/Invoices/InvoiceReviewTests.swift',
          profile: 'always-pass',
          durationMs: 6800
        }
      ]
    }
  },
  {
    id: 'cadaa',
    name: 'Cadaa',
    description: 'Compliance & Digital Auditing Automation',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/cadaa_test',
    layers: {
      web: [
        {
          id: 'cadaa-web-audit-run',
          suite: 'Auditing Engine',
          title: 'Trigger multi-entity SOC2 compliance scan',
          file: 'tests/web/audit/soc2-scan.spec.ts',
          profile: 'always-pass',
          durationMs: 7400
        },
        {
          id: 'cadaa-web-evidence-upload',
          suite: 'Evidence Vault',
          title: 'Upload encrypted compliance evidence with cryptographic signature',
          file: 'tests/web/evidence/upload.spec.ts',
          profile: 'always-pass',
          durationMs: 5100
        }
      ],
      api: [
        {
          id: 'cadaa-api-scan-status',
          suite: 'Scan API',
          title: 'GET /api/v1/scans/:id/progress - poll scan completion percentage',
          file: 'tests/api/scans/scan-progress.spec.ts',
          profile: 'always-pass',
          durationMs: 340
        },
        {
          id: 'cadaa-api-export-pdf',
          suite: 'Reports API',
          title: 'POST /api/v1/reports/soc2/generate - PDF generator pipeline',
          file: 'tests/api/reports/soc2-pdf.spec.ts',
          profile: 'flaky',
          error: {
            message: 'TimeoutError: Puppeteer worker PDF render timed out at 45s',
            stack: 'TimeoutError: Render timeout\n    at PdfService.render(pdf.service.ts:112)\n    at tests/api/reports/soc2-pdf.spec.ts:29',
            step: 'await reportClient.generatePdf(scanId)'
          },
          durationMs: 46000
        }
      ],
      android: [
        {
          id: 'cadaa-android-scanner',
          suite: 'Document Scanning',
          title: 'QR Code physical asset tag scanner verification',
          file: 'android/tests/scanner/QrScanTest.kt',
          profile: 'always-pass',
          durationMs: 5800
        }
      ],
      ios: [
        {
          id: 'cadaa-ios-scanner',
          suite: 'Document Scanning',
          title: 'VisionKit barcode and document perimeter auto-detection',
          file: 'ios/Tests/Scanner/VisionKitScannerTests.swift',
          profile: 'always-pass',
          durationMs: 6100
        }
      ]
    }
  },
  {
    id: 'kuiper',
    name: 'Kuiper',
    description: 'High-Throughput Analytics & Telemetry Engine',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/kuiper_test',
    layers: {
      web: [
        {
          id: 'kuiper-web-dashboard',
          suite: 'Realtime Telemetry',
          title: 'Stream 10,000 telemetry datapoints via WebSocket to canvas chart',
          file: 'tests/web/telemetry/stream.spec.ts',
          profile: 'always-pass',
          durationMs: 8200
        }
      ],
      api: [
        {
          id: 'kuiper-api-ingest',
          suite: 'Ingestion Pipeline',
          title: 'POST /v2/events/batch - high volume ingestion 5k events/sec',
          file: 'tests/api/ingest/batch-events.spec.ts',
          profile: 'always-pass',
          durationMs: 1450
        },
        {
          id: 'kuiper-api-query',
          suite: 'Analytics Queries',
          title: 'POST /v2/analytics/aggregate - SQL rollup with 30-day window',
          file: 'tests/api/analytics/aggregate.spec.ts',
          profile: 'recent-fail',
          error: {
            message: 'ClickHouseException: Memory limit exceeded for query (used 8.2 GB / max 8.0 GB)',
            stack: 'ClickHouseException: Memory limit exceeded\n    at ClickHouseClient.query (src/db/clickhouse.ts:92)\n    at tests/api/analytics/aggregate.spec.ts:51',
            step: 'await analyticsClient.runRollupQuery(queryPayload)'
          },
          durationMs: 4200
        }
      ],
      android: [],
      ios: []
    }
  },
  {
    id: 'atlas',
    name: 'Atlas',
    description: 'Enterprise Geolocation & Fleet Tracking',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/atlas_test',
    layers: {
      web: [
        {
          id: 'atlas-web-map-clustering',
          suite: 'Fleet Map View',
          title: 'Mapbox GL supercluster vehicle markers with live breadcrumbs',
          file: 'tests/web/map/clustering.spec.ts',
          profile: 'always-pass',
          durationMs: 5400
        }
      ],
      api: [
        {
          id: 'atlas-api-geofence',
          suite: 'Geofence API',
          title: 'POST /api/v1/geofence/detect - polygon intersection detection',
          file: 'tests/api/geofence/detect.spec.ts',
          profile: 'always-pass',
          durationMs: 410
        }
      ],
      android: [
        {
          id: 'atlas-android-gps-service',
          suite: 'Background Location',
          title: 'Foreground service GPS coordinate batching during battery saver mode',
          file: 'android/tests/gps/BatterySaverGpsTest.kt',
          profile: 'always-pass',
          durationMs: 11200
        }
      ],
      ios: [
        {
          id: 'atlas-ios-significant-location',
          suite: 'CoreLocation',
          title: 'Significant location change wakeup and battery benchmark',
          file: 'ios/Tests/Location/SignificantLocationTests.swift',
          profile: 'always-pass',
          durationMs: 10500
        }
      ]
    }
  }
];

// Build individual project files and summary
const projectSummaries = [];

for (const p of projects) {
  const allTests = [];
  const layersSummary = {};

  const layerKeys = ['web', 'api', 'android', 'ios'];
  for (const layer of layerKeys) {
    const rawTests = p.layers[layer] || [];
    let lPassed = 0;
    let lFailed = 0;
    let lFlaky = 0;
    let lSkipped = 0;

    for (const t of rawTests) {
      const history = generateTestHistory(t.id, layer, 'passed', t.profile);
      const latestRun = history[history.length - 1];

      let currentStatus = latestRun.status;
      if (currentStatus === 'passed') lPassed++;
      else if (currentStatus === 'failed') lFailed++;
      else if (currentStatus === 'flaky') lFlaky++;
      else if (currentStatus === 'skipped') lSkipped++;

      allTests.push({
        id: t.id,
        layer,
        suite: t.suite,
        title: t.title,
        file: t.file,
        currentStatus,
        lastRunAt: `${latestRun.date}T10:30:00Z`,
        durationMs: t.durationMs,
        latestError: t.error || null,
        history30d: history
      });
    }

    const lTotal = rawTests.length;
    layersSummary[layer] = {
      name: layer === 'web' ? 'Web' : layer === 'api' ? 'API' : layer === 'android' ? 'Mobile - Android' : 'Mobile - iOS',
      total: lTotal,
      passed: lPassed,
      failed: lFailed,
      flaky: lFlaky,
      skipped: lSkipped,
      passRate: lTotal > 0 ? Number(((lPassed / lTotal) * 100).toFixed(1)) : 100
    };
  }

  const total = allTests.length;
  const passed = allTests.filter(t => t.currentStatus === 'passed').length;
  const failed = allTests.filter(t => t.currentStatus === 'failed').length;
  const flaky = allTests.filter(t => t.currentStatus === 'flaky').length;
  const skipped = allTests.filter(t => t.currentStatus === 'skipped').length;
  const passRate = total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 100;

  // Build runs history for charts (30 days)
  const runsHistory = dates30d.map((date) => {
    let dayPassed = 0;
    let dayFailed = 0;
    let dayFlaky = 0;
    let daySkipped = 0;

    allTests.forEach(t => {
      const dayRec = t.history30d.find(h => h.date === date);
      if (dayRec) {
        if (dayRec.status === 'passed') dayPassed++;
        else if (dayRec.status === 'failed') dayFailed++;
        else if (dayRec.status === 'flaky') dayFlaky++;
        else if (dayRec.status === 'skipped') daySkipped++;
      }
    });

    const dayTotal = dayPassed + dayFailed + dayFlaky + daySkipped;
    const rate = dayTotal > 0 ? Number(((dayPassed / dayTotal) * 100).toFixed(1)) : 100;

    return {
      date,
      total: dayTotal,
      passed: dayPassed,
      failed: dayFailed,
      flaky: dayFlaky,
      skipped: daySkipped,
      passRate: rate
    };
  });

  const projectPayload = {
    projectId: p.id,
    projectName: p.name,
    description: p.description,
    repoUrl: p.repoUrl,
    lastUpdated: new Date().toISOString(),
    retentionDays: 30,
    summary: {
      total,
      passed,
      failed,
      flaky,
      skipped,
      passRate
    },
    layers: layersSummary,
    tests: allTests,
    runsHistory
  };

  const projectFilePath = path.join(PROJECTS_DIR, `${p.id}.json`);
  fs.writeFileSync(projectFilePath, JSON.stringify(projectPayload, null, 2));
  console.log(`Saved ${p.name} data to ${projectFilePath}`);

  projectSummaries.push({
    id: p.id,
    name: p.name,
    description: p.description,
    repoUrl: p.repoUrl,
    lastUpdated: projectPayload.lastUpdated,
    summary: projectPayload.summary,
    layers: {
      web: layersSummary.web.passRate,
      api: layersSummary.api.passRate,
      android: layersSummary.android.passRate,
      ios: layersSummary.ios.passRate
    }
  });
}

// Write the global lightweight projects-summary.json
const globalSummary = {
  lastUpdated: new Date().toISOString(),
  totalProjects: projectSummaries.length,
  overallSummary: {
    totalTests: projectSummaries.reduce((acc, p) => acc + p.summary.total, 0),
    totalPassed: projectSummaries.reduce((acc, p) => acc + p.summary.passed, 0),
    totalFailed: projectSummaries.reduce((acc, p) => acc + p.summary.failed, 0),
    totalFlaky: projectSummaries.reduce((acc, p) => acc + p.summary.flaky, 0),
    totalSkipped: projectSummaries.reduce((acc, p) => acc + p.summary.skipped, 0),
  },
  projects: projectSummaries
};

globalSummary.overallSummary.passRate = Number(
  ((globalSummary.overallSummary.totalPassed / globalSummary.overallSummary.totalTests) * 100).toFixed(1)
);

const summaryFilePath = path.join(DATA_DIR, 'projects-summary.json');
fs.writeFileSync(summaryFilePath, JSON.stringify(globalSummary, null, 2));
console.log(`Saved global summary to ${summaryFilePath}`);
