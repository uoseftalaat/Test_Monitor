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
      mobile: [
        {
          id: 'arm-mobile-login-biometric',
          suite: 'Mobile Authentication',
          title: 'Biometric fingerprint & FaceID login validation',
          file: 'mobile/tests/auth/BiometricLoginTest.ts',
          profile: 'always-pass',
          durationMs: 8200
        },
        {
          id: 'arm-mobile-project-sync',
          suite: 'Offline Data Sync',
          title: 'Sync offline task updates with exponential backoff upon network restoration',
          file: 'mobile/tests/sync/OfflineSyncTest.ts',
          profile: 'intermittent',
          error: {
            message: 'DatabaseException: Local storage schema mismatch on offline sync worker',
            stack: 'DatabaseException: Sync failed\n    at MobileSyncEngine.doWork(SyncEngine.ts:62)\n    at mobile/tests/sync/OfflineSyncTest.ts:41',
            step: 'await mobileApp.syncEngine.triggerSync()'
          },
          durationMs: 14200
        },
        {
          id: 'arm-mobile-receipt-upload',
          suite: 'Expenses & Invoices',
          title: 'Capture expense receipt camera photo and attach to active draft',
          file: 'mobile/tests/expenses/ReceiptUploadTest.ts',
          profile: 'always-pass',
          durationMs: 9400
        },
        {
          id: 'arm-mobile-push-notification',
          suite: 'Push Notifications',
          title: 'Receive remote push notification and deep-link to project details screen',
          file: 'mobile/tests/push/PushRoutingTest.ts',
          profile: 'recent-fail',
          error: {
            message: 'NavigationError: Deep link target ProjectDetailScreen did not mount within 10000ms',
            stack: 'NavigationError: Deep link timeout\n    at Router.navigateTo(router.ts:89)\n    at mobile/tests/push/PushRoutingTest.ts:54',
            step: 'await mobileApp.simulatePushPayload(payload)'
          },
          durationMs: 10800
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
      mobile: [
        {
          id: 'cadaa-mobile-scanner',
          suite: 'Document Scanning',
          title: 'QR Code physical asset tag camera scanner verification',
          file: 'mobile/tests/scanner/QrScanTest.ts',
          profile: 'always-pass',
          durationMs: 5800
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
      mobile: []
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
      mobile: [
        {
          id: 'atlas-mobile-gps-service',
          suite: 'Background Location',
          title: 'Foreground location coordinate batching during battery saver mode',
          file: 'mobile/tests/gps/LocationServiceTest.ts',
          profile: 'always-pass',
          durationMs: 11200
        }
      ]
    }
  }
];

const projectSummaries = [];

for (const p of projects) {
  const projectSubDir = path.join(PROJECTS_DIR, p.id);
  if (!fs.existsSync(projectSubDir)) {
    fs.mkdirSync(projectSubDir, { recursive: true });
  }

  // 3 Layers: web, api, mobile
  const layerKeys = ['web', 'api', 'mobile'];
  const layersMeta = {};
  let pTotal = 0;
  let pPassed = 0;
  let pFailed = 0;
  let pFlaky = 0;
  let pSkipped = 0;

  for (const layer of layerKeys) {
    const rawTests = p.layers[layer] || [];
    const layerTests = [];
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

      layerTests.push({
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
    const lPassRate = lTotal > 0 ? Number(((lPassed / lTotal) * 100).toFixed(1)) : 100;

    // Per-layer runs history (30 days)
    const layerRunsHistory = dates30d.map((date) => {
      let dayPassed = 0;
      let dayFailed = 0;
      let dayFlaky = 0;
      let daySkipped = 0;

      layerTests.forEach(t => {
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

    const layerPayload = {
      projectId: p.id,
      projectName: p.name,
      layer,
      layerName: layer === 'web' ? 'Web' : layer === 'api' ? 'API' : 'Mobile',
      lastUpdated: new Date().toISOString(),
      summary: {
        total: lTotal,
        passed: lPassed,
        failed: lFailed,
        flaky: lFlaky,
        skipped: lSkipped,
        passRate: lPassRate
      },
      tests: layerTests,
      runsHistory: layerRunsHistory
    };

    // Save individual layer file: public/data/projects/{projectId}/{layer}.json
    const layerFilePath = path.join(projectSubDir, `${layer}.json`);
    fs.writeFileSync(layerFilePath, JSON.stringify(layerPayload, null, 2));

    layersMeta[layer] = {
      name: layerPayload.layerName,
      total: lTotal,
      passed: lPassed,
      failed: lFailed,
      flaky: lFlaky,
      skipped: lSkipped,
      passRate: lPassRate
    };

    pTotal += lTotal;
    pPassed += lPassed;
    pFailed += lFailed;
    pFlaky += lFlaky;
    pSkipped += lSkipped;
  }

  const pPassRate = pTotal > 0 ? Number(((pPassed / pTotal) * 100).toFixed(1)) : 100;

  const manifest = {
    projectId: p.id,
    projectName: p.name,
    description: p.description,
    repoUrl: p.repoUrl,
    lastUpdated: new Date().toISOString(),
    retentionDays: 30,
    summary: {
      total: pTotal,
      passed: pPassed,
      failed: pFailed,
      flaky: pFlaky,
      skipped: pSkipped,
      passRate: pPassRate
    },
    layers: layersMeta
  };

  const manifestPath = path.join(projectSubDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  projectSummaries.push({
    id: p.id,
    name: p.name,
    description: p.description,
    repoUrl: p.repoUrl,
    lastUpdated: manifest.lastUpdated,
    summary: manifest.summary,
    layers: {
      web: layersMeta.web.passRate,
      api: layersMeta.api.passRate,
      mobile: layersMeta.mobile.passRate
    }
  });

  console.log(`Generated per-layer files for project ${p.name} (web, api, mobile) in ${projectSubDir}`);
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
