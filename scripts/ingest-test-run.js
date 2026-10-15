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

const projectFilePath = path.join(PROJECTS_DIR, `${projectId}.json`);
if (!fs.existsSync(projectFilePath)) {
  console.error(`Project data file does not exist: ${projectFilePath}`);
  process.exit(1);
}

const projectData = JSON.parse(fs.readFileSync(projectFilePath, 'utf8'));

// Extract tests from report (Supports standard Playwright JSON report or simplified format)
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
  // It's a standard Playwright JSON report
  traversePlaywrightSuites(rawReport.suites);
} else if (Array.isArray(rawReport.tests)) {
  // It's a simplified custom format
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

console.log(`Parsed ${parsedTests.length} tests for project ${projectId} (${layer})`);

// 30-Day cutoff timestamp
const now = new Date();
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 30);
const todayStr = now.toISOString().split('T')[0];

// Merge into projectData.tests
if (!projectData.tests) projectData.tests = [];

for (const incoming of parsedTests) {
  let existing = projectData.tests.find(t => t.id === incoming.id || (t.title === incoming.title && t.layer === layer));
  
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
    projectData.tests.push(existing);
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
if (!projectData.layers) projectData.layers = {};
const layerTests = projectData.tests.filter(t => t.layer === layer);
const lTotal = layerTests.length;
const lPassed = layerTests.filter(t => t.currentStatus === 'passed').length;
const lFailed = layerTests.filter(t => t.currentStatus === 'failed').length;
const lFlaky = layerTests.filter(t => t.currentStatus === 'flaky').length;
const lSkipped = layerTests.filter(t => t.currentStatus === 'skipped').length;
const lPassRate = lTotal > 0 ? Number(((lPassed / lTotal) * 100).toFixed(1)) : 100;

projectData.layers[layer] = {
  name: layer === 'web' ? 'Web' : layer === 'api' ? 'API' : layer === 'android' ? 'Mobile - Android' : 'Mobile - iOS',
  total: lTotal,
  passed: lPassed,
  failed: lFailed,
  flaky: lFlaky,
  skipped: lSkipped,
  passRate: lPassRate
};

// Recompute total project summary
const total = projectData.tests.length;
const passed = projectData.tests.filter(t => t.currentStatus === 'passed').length;
const failed = projectData.tests.filter(t => t.currentStatus === 'failed').length;
const flaky = projectData.tests.filter(t => t.currentStatus === 'flaky').length;
const skipped = projectData.tests.filter(t => t.currentStatus === 'skipped').length;
const passRate = total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 100;

projectData.summary = { total, passed, failed, flaky, skipped, passRate };
projectData.lastUpdated = now.toISOString();

// Write updated project file
fs.writeFileSync(projectFilePath, JSON.stringify(projectData, null, 2));
console.log(`Updated ${projectFilePath}`);

// Update public/data/projects-summary.json
const summaryFilePath = path.join(DATA_DIR, 'projects-summary.json');
if (fs.existsSync(summaryFilePath)) {
  const globalSummary = JSON.parse(fs.readFileSync(summaryFilePath, 'utf8'));
  const projIdx = globalSummary.projects.findIndex(p => p.id === projectId);
  const updatedEntry = {
    id: projectId,
    name: projectData.projectName,
    description: projectData.description,
    repoUrl: projectData.repoUrl,
    lastUpdated: projectData.lastUpdated,
    summary: projectData.summary,
    layers: Object.fromEntries(Object.entries(projectData.layers).map(([k, v]) => [k, v.passRate]))
  };

  if (projIdx >= 0) globalSummary.projects[projIdx] = updatedEntry;
  else globalSummary.projects.push(updatedEntry);

  globalSummary.lastUpdated = now.toISOString();
  globalSummary.overallSummary = {
    totalTests: globalSummary.projects.reduce((acc, p) => acc + p.summary.total, 0),
    totalPassed: globalSummary.projects.reduce((acc, p) => acc + p.summary.passed, 0),
    totalFailed: globalSummary.projects.reduce((acc, p) => acc + p.summary.failed, 0),
    totalFlaky: globalSummary.projects.reduce((acc, p) => acc + p.summary.flaky, 0),
    totalSkipped: globalSummary.projects.reduce((acc, p) => acc + p.summary.skipped, 0),
  };
  globalSummary.overallSummary.passRate = Number(
    ((globalSummary.overallSummary.totalPassed / globalSummary.overallSummary.totalTests) * 100).toFixed(1)
  );

  fs.writeFileSync(summaryFilePath, JSON.stringify(globalSummary, null, 2));
  console.log(`Updated ${summaryFilePath}`);
}
