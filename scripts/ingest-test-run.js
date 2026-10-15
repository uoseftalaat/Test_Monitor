import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../public/data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');

// Parse CLI arguments: --project arm --layer web --report ./report.json --run-id 12345
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      params[key] = val;
      if (val !== true) i++;
    }
  }
  return params;
}

const args = parseArgs();
const projectId = args.project || 'arm';
const layer = args.layer || 'api'; // web, api, mobile
const reportPath = args.report;
const htmlReportPath = args['html-report'];
const runId = args['run-id'] || `manual-${Date.now()}`;

// ============================================================================
// FAIL-SAFE 1: Verify report file existence and non-zero size
// ============================================================================
if (!reportPath || !fs.existsSync(reportPath)) {
  console.warn(`⚠️ FAIL-SAFE: Report file not found at: ${reportPath}. Aborting without modifying existing data.`);
  process.exit(0);
}

const stats = fs.statSync(reportPath);
if (stats.size === 0) {
  console.warn(`⚠️ FAIL-SAFE: Report file is completely empty (0 bytes). Preserving existing data.`);
  process.exit(0);
}

// ============================================================================
// FAIL-SAFE 2: Verify valid JSON formatting in incoming report
// ============================================================================
let rawReport;
try {
  rawReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch (err) {
  console.error(`❌ FAIL-SAFE: Incoming report is corrupted or invalid JSON: ${err.message}. Aborting to protect existing data.`);
  process.exit(0);
}

const projectSubDir = path.join(PROJECTS_DIR, projectId);
if (!fs.existsSync(projectSubDir)) {
  fs.mkdirSync(projectSubDir, { recursive: true });
}

const layerFilePath = path.join(projectSubDir, `${layer}.json`);
const manifestPath = path.join(projectSubDir, 'manifest.json');

// Load existing data with fallback
let layerData = {
  projectId,
  projectName: projectId.toUpperCase(),
  layer,
  layerName: layer === 'web' ? 'Web' : layer === 'api' ? 'API' : 'Mobile',
  lastUpdated: new Date().toISOString(),
  summary: { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 },
  tests: [],
  runsHistory: []
};

if (fs.existsSync(layerFilePath)) {
  try {
    const existingContent = fs.readFileSync(layerFilePath, 'utf8');
    if (existingContent.trim().length > 0) {
      layerData = JSON.parse(existingContent);
    }
  } catch (e) {
    console.warn(`⚠️ Existing ${layerFilePath} had parsing issues. Initializing fresh structure.`);
  }
}

// Extract tests from report
const parsedTests = [];

function traversePlaywrightSuites(suites, parentTitle = '') {
  if (!Array.isArray(suites)) return;
  for (const suite of suites) {
    const fullSuiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;
    if (suite.specs && Array.isArray(suite.specs)) {
      for (const spec of suite.specs) {
        if (!spec.tests) continue;
        for (const test of spec.tests) {
          const latestResult = test.results?.[test.results.length - 1] || {};
          let status = 'passed';
          if (test.status === 'unexpected') status = 'failed';
          else if (test.status === 'flaky') status = 'flaky';
          else if (test.status === 'skipped') status = 'skipped';
          else if (latestResult.status === 'failed' || latestResult.status === 'timedOut') status = 'failed';

          let error = null;
          if (latestResult.error) {
            error = {
              message: latestResult.error.message || 'Test execution failed',
              stack: latestResult.error.stack || '',
              step: latestResult.error.snippet || ''
            };
          }

          // Build a globally unique, stable ID for this test
          const testId = spec.id 
            ? `${projectId}-${layer}-${spec.id}` 
            : `${projectId}-${layer}-${spec.file || 'spec'}:${spec.line || 0}:${test.projectName || ''}:${spec.title}`
                .toLowerCase()
                .replace(/[^a-z0-9:_\-\/\.]/g, '-');

          parsedTests.push({
            id: testId,
            suite: fullSuiteTitle || 'Default Suite',
            title: spec.title || 'Untitled Test',
            file: spec.file || '',
            status,
            durationMs: latestResult.duration || 0,
            error
          });
        }
      }
    }
    if (suite.suites) {
      traversePlaywrightSuites(suite.suites, fullSuiteTitle);
    }
  }
}

if (rawReport.suites) {
  traversePlaywrightSuites(rawReport.suites);
} else if (Array.isArray(rawReport.tests)) {
  for (const t of rawReport.tests) {
    parsedTests.push({
      id: t.id || `${projectId}-${layer}-${t.file || 'test'}:${t.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      suite: t.suite || 'General',
      title: t.title || 'Untitled Test',
      file: t.file || '',
      status: t.status || 'passed',
      durationMs: t.durationMs || 0,
      error: t.error || null
    });
  }
}

if (parsedTests.length === 0) {
  console.warn(`⚠️ FAIL-SAFE: 0 tests were found in the incoming report. Preserving existing test records.`);
  process.exit(0);
}

console.log(`Parsed ${parsedTests.length} tests for ${projectId} [${layer}]`);

// 30-Day cutoff timestamp
const now = new Date();
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 30);
const todayStr = now.toISOString().split('T')[0];

if (!Array.isArray(layerData.tests)) layerData.tests = [];

// Filter out any legacy dummy/mock tests if present (e.g. arm-api-encryption-keys)
layerData.tests = layerData.tests.filter(t => 
  !t.id.startsWith('arm-api-encryption') && 
  !t.id.startsWith('arm-api-project') && 
  !t.id.startsWith('arm-api-estimation') && 
  !t.id.startsWith('arm-api-filtered') && 
  !t.id.startsWith('arm-api-assigned')
);

// Map incoming tests strictly by unique ID (do not de-duplicate solely by title)
for (const incoming of parsedTests) {
  let existing = layerData.tests.find(t => t.id === incoming.id);

  if (!existing) {
    existing = {
      id: incoming.id,
      layer,
      suite: incoming.suite,
      title: incoming.title,
      file: incoming.file,
      currentStatus: incoming.status,
      lastRunAt: now.toISOString(),
      durationMs: incoming.durationMs,
      latestError: incoming.error,
      history30d: []
    };
    layerData.tests.push(existing);
  } else {
    existing.currentStatus = incoming.status;
    existing.lastRunAt = now.toISOString();
    existing.durationMs = incoming.durationMs;
    if (incoming.error) existing.latestError = incoming.error;
    else if (incoming.status === 'passed') existing.latestError = null;
  }

  // Append history and prune records older than 30 days
  existing.history30d = (existing.history30d || []).filter(h => new Date(h.date) >= cutoffDate);
  existing.history30d.push({
    date: todayStr,
    runId,
    status: incoming.status,
    durationMs: incoming.durationMs,
    ...(incoming.error ? { error: incoming.error.message } : {})
  });
}

// Sort tests with failures prioritized on top: failed (0) -> flaky (1) -> passed (2) -> skipped (3)
const STATUS_PRIORITY = { failed: 0, flaky: 1, passed: 2, skipped: 3 };
layerData.tests.sort((a, b) => {
  const pA = STATUS_PRIORITY[a.currentStatus] ?? 99;
  const pB = STATUS_PRIORITY[b.currentStatus] ?? 99;
  if (pA !== pB) return pA - pB;
  const suiteCmp = (a.suite || '').localeCompare(b.suite || '');
  if (suiteCmp !== 0) return suiteCmp;
  return (a.title || '').localeCompare(b.title || '');
});

// Recompute layer summary
const lTotal = layerData.tests.length;
const lPassed = layerData.tests.filter(t => t.currentStatus === 'passed').length;
const lFailed = layerData.tests.filter(t => t.currentStatus === 'failed').length;
const lFlaky = layerData.tests.filter(t => t.currentStatus === 'flaky').length;
const lSkipped = layerData.tests.filter(t => t.currentStatus === 'skipped').length;
const lPassRate = lTotal > 0 ? Number(((lPassed / lTotal) * 100).toFixed(1)) : 100;

layerData.summary = {
  total: lTotal,
  passed: lPassed,
  failed: lFailed,
  flaky: lFlaky,
  skipped: lSkipped,
  passRate: lPassRate
};
layerData.lastUpdated = now.toISOString();

// Append to layer runsHistory
if (!Array.isArray(layerData.runsHistory)) layerData.runsHistory = [];
layerData.runsHistory = layerData.runsHistory.filter(r => new Date(r.date) >= cutoffDate);
const existingDayRun = layerData.runsHistory.find(r => r.date === todayStr);
if (existingDayRun) {
  existingDayRun.total = lTotal;
  existingDayRun.passed = lPassed;
  existingDayRun.failed = lFailed;
  existingDayRun.flaky = lFlaky;
  existingDayRun.skipped = lSkipped;
  existingDayRun.passRate = lPassRate;
} else {
  layerData.runsHistory.push({
    date: todayStr,
    total: lTotal,
    passed: lPassed,
    failed: lFailed,
    flaky: lFlaky,
    skipped: lSkipped,
    passRate: lPassRate
  });
}

// ============================================================================
// Playwright Daily Failure Report Handling
// If there are failures in today's run, retain the Playwright HTML report.
// If there are no failures (or failures have been resolved), the section remains empty.
// ============================================================================
const reportsBaseDir = path.join(__dirname, '../public/reports', projectId, layer);

if (lFailed > 0) {
  let reportUrl = null;
  if (htmlReportPath && fs.existsSync(htmlReportPath)) {
    try {
      fs.mkdirSync(reportsBaseDir, { recursive: true });
      const stat = fs.statSync(htmlReportPath);
      if (stat.isDirectory()) {
        fs.cpSync(htmlReportPath, reportsBaseDir, { recursive: true });
      } else {
        fs.copyFileSync(htmlReportPath, path.join(reportsBaseDir, 'index.html'));
      }
      reportUrl = `reports/${projectId}/${layer}/index.html`;
      console.log(`✅ Staged Playwright failure HTML report to: ${reportsBaseDir}`);
    } catch (copyErr) {
      console.warn(`⚠️ Warning copying HTML report: ${copyErr.message}`);
    }
  } else if (fs.existsSync(path.join(reportsBaseDir, 'index.html'))) {
    reportUrl = `reports/${projectId}/${layer}/index.html`;
  }

  layerData.playwrightReport = {
    hasFailures: true,
    runId: runId || null,
    date: todayStr,
    timestamp: now.toISOString(),
    failedCount: lFailed,
    totalCount: lTotal,
    reportUrl: reportUrl,
    failedTests: layerData.tests
      .filter(t => t.currentStatus === 'failed')
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        title: t.title,
        suite: t.suite,
        file: t.file,
        errorMessage: t.latestError?.message || 'Test failed'
      }))
  };
} else {
  // If there are no failures, clean up any previous failure report so the section remains empty
  if (fs.existsSync(reportsBaseDir)) {
    try {
      fs.rmSync(reportsBaseDir, { recursive: true, force: true });
    } catch (_) {}
  }
  layerData.playwrightReport = null;
}

// Atomic Write
const tempLayerFile = `${layerFilePath}.tmp`;
try {
  fs.writeFileSync(tempLayerFile, JSON.stringify(layerData, null, 2));
  fs.renameSync(tempLayerFile, layerFilePath);
  console.log(`✅ Atomic write succeeded: ${layerFilePath}`);
} catch (writeErr) {
  console.error(`❌ Atomic write error for ${layerFilePath}: ${writeErr.message}`);
  if (fs.existsSync(tempLayerFile)) fs.unlinkSync(tempLayerFile);
  process.exit(1);
}

// Update manifest.json atomically
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest.layers) manifest.layers = {};
    manifest.layers[layer] = {
      name: layerData.layerName,
      total: lTotal,
      passed: lPassed,
      failed: lFailed,
      flaky: lFlaky,
      skipped: lSkipped,
      passRate: lPassRate,
      playwrightReport: layerData.playwrightReport
    };

    const layersList = Object.values(manifest.layers);
    const mTotal = layersList.reduce((acc, l) => acc + (l.total || 0), 0);
    const mPassed = layersList.reduce((acc, l) => acc + (l.passed || 0), 0);
    const mFailed = layersList.reduce((acc, l) => acc + (l.failed || 0), 0);
    const mFlaky = layersList.reduce((acc, l) => acc + (l.flaky || 0), 0);
    const mSkipped = layersList.reduce((acc, l) => acc + (l.skipped || 0), 0);
    const mPassRate = mTotal > 0 ? Number(((mPassed / mTotal) * 100).toFixed(1)) : 100;

    manifest.summary = { total: mTotal, passed: mPassed, failed: mFailed, flaky: mFlaky, skipped: mSkipped, passRate: mPassRate };
    manifest.lastUpdated = now.toISOString();

    const tempManifest = `${manifestPath}.tmp`;
    fs.writeFileSync(tempManifest, JSON.stringify(manifest, null, 2));
    fs.renameSync(tempManifest, manifestPath);
  } catch (manifestErr) {
    console.warn(`⚠️ Warning updating manifest: ${manifestErr.message}`);
  }
}

// Update public/data/projects-summary.json atomically
const summaryFilePath = path.join(DATA_DIR, 'projects-summary.json');
if (fs.existsSync(summaryFilePath)) {
  try {
    const globalSummary = JSON.parse(fs.readFileSync(summaryFilePath, 'utf8'));
    const projIdx = globalSummary.projects.findIndex(p => p.id === projectId);
    
    if (projIdx >= 0) {
      if (!globalSummary.projects[projIdx].layers) globalSummary.projects[projIdx].layers = {};
      globalSummary.projects[projIdx].layers[layer] = lPassRate;
      globalSummary.projects[projIdx].lastUpdated = now.toISOString();
      globalSummary.projects[projIdx].summary = {
        total: lTotal,
        passed: lPassed,
        failed: lFailed,
        flaky: lFlaky,
        skipped: lSkipped,
        passRate: lPassRate
      };
    }

    const tempSummary = `${summaryFilePath}.tmp`;
    fs.writeFileSync(tempSummary, JSON.stringify(globalSummary, null, 2));
    fs.renameSync(tempSummary, summaryFilePath);
    console.log(`✅ Atomic update of global summary: ${summaryFilePath}`);
  } catch (summaryErr) {
    console.warn(`⚠️ Warning updating summary: ${summaryErr.message}`);
  }
}
