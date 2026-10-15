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
const layer = args.layer || 'api'; // web, api, android, ios
const reportPath = args.report;
const runId = args['run-id'] || `manual-${Date.now()}`;

if (!reportPath || !fs.existsSync(reportPath)) {
  console.error(`Error: Report file not found at: ${reportPath}`);
  console.log(`Usage: node scripts/ingest-test-run.js --project <arm|cadaa|...> --layer <web|api|android|ios> --report <path-to-json> [--run-id <id>]`);
  process.exit(1);
}

const rawReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const projectSubDir = path.join(PROJECTS_DIR, projectId);
if (!fs.existsSync(projectSubDir)) {
  fs.mkdirSync(projectSubDir, { recursive: true });
}

const layerFilePath = path.join(projectSubDir, `${layer}.json`);
const manifestPath = path.join(projectSubDir, 'manifest.json');

let layerData = {
  projectId,
  projectName: projectId.toUpperCase(),
  layer,
  layerName: layer === 'web' ? 'Web' : layer === 'api' ? 'API' : layer === 'android' ? 'Mobile - Android' : 'Mobile - iOS',
  lastUpdated: new Date().toISOString(),
  summary: { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 },
  tests: [],
  runsHistory: []
};

if (fs.existsSync(layerFilePath)) {
  try {
    layerData = JSON.parse(fs.readFileSync(layerFilePath, 'utf8'));
  } catch (e) {
    console.warn(`Could not parse existing ${layerFilePath}, creating fresh structure`);
  }
}

// Extract tests from report (Supports standard Playwright JSON report or simplified custom format)
const parsedTests = [];

function traversePlaywrightSuites(suites, parentTitle = '') {
  for (const suite of suites) {
    const fullSuiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;
    if (suite.specs) {
      for (const spec of suite.specs) {
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

          parsedTests.push({
            id: `${projectId}-${layer}-${spec.id || spec.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            suite: fullSuiteTitle || 'Default Suite',
            title: spec.title,
            file: spec.file,
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
      id: t.id || `${projectId}-${layer}-${t.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      suite: t.suite || 'General',
      title: t.title,
      file: t.file || '',
      status: t.status || 'passed',
      durationMs: t.durationMs || 0,
      error: t.error || null
    });
  }
}

console.log(`Parsed ${parsedTests.length} tests for ${projectId} [${layer}]`);

// 30-Day cutoff timestamp
const now = new Date();
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 30);
const todayStr = now.toISOString().split('T')[0];

if (!layerData.tests) layerData.tests = [];

for (const incoming of parsedTests) {
  let existing = layerData.tests.find(t => t.id === incoming.id || t.title === incoming.title);

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
if (!layerData.runsHistory) layerData.runsHistory = [];
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

// Write the layer file
fs.writeFileSync(layerFilePath, JSON.stringify(layerData, null, 2));
console.log(`✅ Saved layer file: ${layerFilePath}`);

// Update manifest.json if exists
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest.layers) manifest.layers = {};
  manifest.layers[layer] = {
    name: layerData.layerName,
    total: lTotal,
    passed: lPassed,
    failed: lFailed,
    flaky: lFlaky,
    skipped: lSkipped,
    passRate: lPassRate
  };

  const layersList = Object.values(manifest.layers);
  const mTotal = layersList.reduce((acc, l) => acc + l.total, 0);
  const mPassed = layersList.reduce((acc, l) => acc + l.passed, 0);
  const mFailed = layersList.reduce((acc, l) => acc + l.failed, 0);
  const mFlaky = layersList.reduce((acc, l) => acc + l.flaky, 0);
  const mSkipped = layersList.reduce((acc, l) => acc + l.skipped, 0);
  const mPassRate = mTotal > 0 ? Number(((mPassed / mTotal) * 100).toFixed(1)) : 100;

  manifest.summary = { total: mTotal, passed: mPassed, failed: mFailed, flaky: mFlaky, skipped: mSkipped, passRate: mPassRate };
  manifest.lastUpdated = now.toISOString();

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

// Update public/data/projects-summary.json
const summaryFilePath = path.join(DATA_DIR, 'projects-summary.json');
if (fs.existsSync(summaryFilePath)) {
  const globalSummary = JSON.parse(fs.readFileSync(summaryFilePath, 'utf8'));
  const projIdx = globalSummary.projects.findIndex(p => p.id === projectId);
  
  if (projIdx >= 0) {
    if (!globalSummary.projects[projIdx].layers) globalSummary.projects[projIdx].layers = {};
    globalSummary.projects[projIdx].layers[layer] = lPassRate;
    globalSummary.projects[projIdx].lastUpdated = now.toISOString();
  }

  fs.writeFileSync(summaryFilePath, JSON.stringify(globalSummary, null, 2));
  console.log(`✅ Updated global summary: ${summaryFilePath}`);
}
