#!/usr/bin/env node
/**
 * Push QA Test Results & Playwright Reports Directly to Firebase
 * Supports JSON test results and zipped Playwright HTML reports (.zip).
 * Concurrency-safe, eliminates Git push collisions and delays.
 *
 * Usage:
 *   node scripts/push-to-firebase.js \
 *     --project arm \
 *     --layer web \
 *     --report path/to/playwright-results.json \
 *     --zip-report path/to/playwright-report.zip \
 *     --run-id 123456
 *
 * Direct URL Usage (e.g. CI Artifact URL):
 *   node scripts/push-to-firebase.js \
 *     --project arm \
 *     --layer web \
 *     --zip-url https://artifacts.example.com/playwright-report-web.zip
 *
 * Requirements:
 *   FIREBASE_SERVICE_ACCOUNT env variable (JSON string, base64 string, or path to service account key file).
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

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
const projectId = (args.project || 'arm').toLowerCase();
const inputLayer = (args.layer || 'api').toLowerCase(); // web, api, mobile, all
const reportPath = args.report;
const zipPath = args['zip-report'] || args['report-zip'] || args['zip'];
const zipUrl = args['zip-url'] || args['zipurl'];
const runId = args['run-id'] || `run-${Date.now()}`;
const credPath = args.credentials || process.env.FIREBASE_SERVICE_ACCOUNT || './service-account.json';
const targetBucket = args.bucket || process.env.FIREBASE_STORAGE_BUCKET || 'test-monitor-46836.firebasestorage.app';

// ============================================================================
// Credentials Verification (Fail-Safe)
// ============================================================================
const hasCredEnv = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
const hasCredArg = Boolean(args.credentials);
const hasLocalCredFile = fs.existsSync('./service-account.json');

if (!hasCredEnv && !hasCredArg && !hasLocalCredFile) {
  console.log('ℹ️ FIREBASE_SERVICE_ACCOUNT secret is not defined in this environment. Skipping sync to Firebase Test Monitor.');
  process.exit(0);
}

// ============================================================================
// Input Validation (Fail-Safe)
// ============================================================================
const hasReportFile = Boolean(reportPath && fs.existsSync(reportPath) && fs.statSync(reportPath).size > 0);
const hasZipFile = Boolean(zipPath && fs.existsSync(zipPath) && fs.statSync(zipPath).size > 0);
const hasZipUrl = Boolean(zipUrl);

if (!hasReportFile && !hasZipFile && !hasZipUrl) {
  console.warn(`⚠️ FAIL-SAFE: No valid test report JSON or zip report provided.`);
  console.log(`
Usage options:
  --project <arm|cadaa|kuiper|atlas>
  --layer <web|api|mobile|all>
  --report path/to/playwright-results.json
  --zip-report path/to/playwright-report.zip
  --zip-url https://... (direct URL to pre-hosted zip)
  --run-id <ci-run-number>
  `);
  process.exit(0);
}

let rawReport = null;
if (hasReportFile) {
  try {
    rawReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  } catch (err) {
    console.error(`❌ FAIL-SAFE: Report is invalid JSON: ${err.message}. Preserving existing data.`);
    process.exit(0);
  }
}

// ============================================================================
// Initialize Firebase Admin
// ============================================================================
function initFirebaseAdmin() {
  if (getApps().length > 0) return getApp();

  let serviceAccount = null;

  if (credPath) {
    if (fs.existsSync(credPath)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
      } catch (err) {
        console.warn(`⚠️ Could not parse service account file: ${err.message}`);
      }
    } else {
      try {
        serviceAccount = JSON.parse(credPath);
      } catch (e) {
        // Try base64 decoded
        try {
          const decoded = Buffer.from(credPath, 'base64').toString('utf8');
          serviceAccount = JSON.parse(decoded);
        } catch (_) {}
      }
    }
  }

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: targetBucket
    });
  }

  // Fallback to default Google Cloud credentials if present
  try {
    return initializeApp({
      storageBucket: targetBucket
    });
  } catch (err) {
    console.warn(`⚠️ Could not initialize Firebase Admin: ${err.message}. Skipping push.`);
    process.exit(0);
  }
}

const app = initFirebaseAdmin();
const db = getFirestore(app);

// ============================================================================
// Parse Test Results
// ============================================================================
const parsedTests = [];

function detectTestLayer(file, projectName, suite) {
  const f = (file || '').toLowerCase();
  const p = (projectName || '').toLowerCase();
  const s = (suite || '').toLowerCase();
  if (f.includes('/web/') || p.includes('web') || s.includes('web')) return 'web';
  if (f.includes('/api/') || p.includes('api') || s.includes('api')) return 'api';
  if (f.includes('/mobile/') || p.includes('mobile') || s.includes('mobile') || f.includes('/app/')) return 'mobile';
  return inputLayer !== 'all' ? inputLayer : 'web';
}

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

          const targetLayer = inputLayer !== 'all'
            ? inputLayer
            : detectTestLayer(spec.file, test.projectName, fullSuiteTitle);

          const testId = spec.id
            ? `${projectId}-${targetLayer}-${spec.id}`
            : `${projectId}-${targetLayer}-${spec.file || 'spec'}:${spec.line || 0}:${test.projectName || ''}:${spec.title}`
                .toLowerCase()
                .replace(/[^a-z0-9:_\-\/\.]/g, '-');

          parsedTests.push({
            id: testId,
            layer: targetLayer,
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

if (rawReport) {
  if (rawReport.suites) {
    traversePlaywrightSuites(rawReport.suites);
  } else if (Array.isArray(rawReport.tests)) {
    for (const t of rawReport.tests) {
      const targetLayer = inputLayer !== 'all'
        ? inputLayer
        : detectTestLayer(t.file, t.projectName, t.suite);
      parsedTests.push({
        id: t.id || `${projectId}-${targetLayer}-${t.file || 'test'}:${t.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        layer: targetLayer,
        suite: t.suite || 'General',
        title: t.title || 'Untitled Test',
        file: t.file || '',
        status: t.status || 'passed',
        durationMs: t.durationMs || 0,
        error: t.error || null
      });
    }
  }
}

// ============================================================================
// Handle Playwright Zip Report (Cloud Upload or Direct URL)
// ============================================================================
async function processPlaywrightZip(layerName, now) {
  // Case A: Pre-hosted or direct URL provided
  if (hasZipUrl) {
    console.log(`🔗 Linking Playwright zip report from direct URL: ${zipUrl}`);
    return {
      url: zipUrl,
      fileName: args['zip-filename'] || `playwright-report-${projectId}-${layerName}.zip`,
      sizeBytes: args['zip-size'] ? Number(args['zip-size']) : null,
      uploadedAt: now.toISOString(),
      runId,
      layer: layerName
    };
  }

  // Case B: Local zip file provided -> upload to Firebase Storage
  if (hasZipFile) {
    const stats = fs.statSync(zipPath);
    const fileName = path.basename(zipPath);
    const destination = `playwright-reports/${projectId}/${layerName}/${Date.now()}-${fileName}`;

    console.log(`📦 Uploading Playwright zip report (${(stats.size / (1024 * 1024)).toFixed(2)} MB) to bucket [${targetBucket}]...`);

    try {
      const storage = getStorage(app);
      const bucket = storage.bucket(targetBucket);

      await bucket.upload(zipPath, {
        destination,
        metadata: {
          contentType: 'application/zip',
          metadata: {
            projectId,
            layer: layerName,
            runId,
            uploadedAt: now.toISOString(),
            originalFileName: fileName
          }
        }
      });

      const file = bucket.file(destination);
      let downloadUrl;
      try {
        // Generate signed download URL with long expiration (10 years)
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: '2036-12-31'
        });
        downloadUrl = signedUrl;
      } catch (signErr) {
        // Fallback to public storage URL
        try {
          await file.makePublic();
        } catch (_) {}
        downloadUrl = `https://storage.googleapis.com/${targetBucket}/${destination}`;
      }

      console.log(`✅ Upload complete! Download URL ready.`);
      return {
        url: downloadUrl,
        fileName,
        sizeBytes: stats.size,
        uploadedAt: now.toISOString(),
        runId,
        layer: layerName,
        storagePath: destination
      };
    } catch (uploadErr) {
      console.warn(`⚠️ Firebase Storage upload note: ${uploadErr.message}`);
      return null;
    }
  }

  return null;
}

// ============================================================================
// Main Execution
// ============================================================================
async function main() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  // Group tests by layer
  const layersToProcess = {};
  if (inputLayer === 'all') {
    for (const test of parsedTests) {
      const l = test.layer || 'web';
      if (!layersToProcess[l]) layersToProcess[l] = [];
      layersToProcess[l].push(test);
    }
    if (Object.keys(layersToProcess).length === 0) {
      layersToProcess['web'] = [];
    }
  } else {
    layersToProcess[inputLayer] = parsedTests;
  }

  const projectRef = db.doc(`projects/${projectId}`);
  const summaryRef = db.doc(`projects-summary/overview`);
  const projectDoc = await projectRef.get();
  const existingProjData = projectDoc.exists ? projectDoc.data() : {};
  const currentLayers = existingProjData.layers || {};

  for (const [currentLayer, testsForLayer] of Object.entries(layersToProcess)) {
    const layerRef = db.doc(`projects/${projectId}/layers/${currentLayer}`);
    const layerDoc = await layerRef.get();
    let existingLayerData = layerDoc.exists
      ? layerDoc.data()
      : {
          projectId,
          projectName: projectId.toUpperCase(),
          layer: currentLayer,
          layerName: currentLayer === 'web' ? 'Web' : currentLayer === 'api' ? 'API' : 'Mobile',
          tests: [],
          runsHistory: []
        };

    const tests = existingLayerData.tests || [];

    if (testsForLayer.length > 0) {
      console.log(`🚀 Merging ${testsForLayer.length} tests for [${projectId} - ${currentLayer}]`);
      for (const incoming of testsForLayer) {
        let existing = tests.find(t => t.id === incoming.id);
        if (!existing) {
          existing = {
            id: incoming.id,
            layer: currentLayer,
            suite: incoming.suite,
            title: incoming.title,
            file: incoming.file,
            currentStatus: incoming.status,
            lastRunAt: now.toISOString(),
            durationMs: incoming.durationMs,
            latestError: incoming.error,
            history30d: []
          };
          tests.push(existing);
        } else {
          existing.currentStatus = incoming.status;
          existing.lastRunAt = now.toISOString();
          existing.durationMs = incoming.durationMs;
          if (incoming.error) existing.latestError = incoming.error;
          else if (incoming.status === 'passed') existing.latestError = null;
        }

        // Update 30d history
        existing.history30d = (existing.history30d || []).filter(h => new Date(h.date) >= cutoffDate);
        existing.history30d.push({
          date: todayStr,
          runId,
          status: incoming.status,
          durationMs: incoming.durationMs,
          ...(incoming.error ? { error: incoming.error.message } : {})
        });
      }

      // Sort tests: failed (0) -> flaky (1) -> passed (2) -> skipped (3)
      const STATUS_PRIORITY = { failed: 0, flaky: 1, passed: 2, skipped: 3 };
      tests.sort((a, b) => {
        const pA = STATUS_PRIORITY[a.currentStatus] ?? 99;
        const pB = STATUS_PRIORITY[b.currentStatus] ?? 99;
        if (pA !== pB) return pA - pB;
        return (a.title || '').localeCompare(b.title || '');
      });
    }

    const lTotal = tests.length;
    const lPassed = tests.filter(t => t.currentStatus === 'passed').length;
    const lFailed = tests.filter(t => t.currentStatus === 'failed').length;
    const lFlaky = tests.filter(t => t.currentStatus === 'flaky').length;
    const lSkipped = tests.filter(t => t.currentStatus === 'skipped').length;
    const lPassRate = lTotal > 0 ? Number(((lPassed / lTotal) * 100).toFixed(1)) : 100;

    // Runs history
    let runsHistory = (existingLayerData.runsHistory || []).filter(r => new Date(r.date) >= cutoffDate);
    if (testsForLayer.length > 0) {
      const existingDayRun = runsHistory.find(r => r.date === todayStr);
      if (existingDayRun) {
        existingDayRun.total = lTotal;
        existingDayRun.passed = lPassed;
        existingDayRun.failed = lFailed;
        existingDayRun.flaky = lFlaky;
        existingDayRun.skipped = lSkipped;
        existingDayRun.passRate = lPassRate;
        existingDayRun.runId = runId;
      } else {
        runsHistory.push({
          date: todayStr,
          runId,
          total: lTotal,
          passed: lPassed,
          failed: lFailed,
          flaky: lFlaky,
          skipped: lSkipped,
          passRate: lPassRate
        });
      }
    }

    // Playwright Zip file or URL
    const newZipPayload = await processPlaywrightZip(currentLayer, now);
    const effectiveZipPayload = newZipPayload || existingLayerData.playwrightZip || null;
    const effectiveZipUrl = effectiveZipPayload?.url || existingLayerData.playwrightZipUrl || null;

    const updatedLayerPayload = {
      projectId,
      projectName: existingLayerData.projectName || projectId.toUpperCase(),
      layer: currentLayer,
      layerName: currentLayer === 'web' ? 'Web' : currentLayer === 'api' ? 'API' : 'Mobile',
      lastUpdated: now.toISOString(),
      summary: {
        total: lTotal,
        passed: lPassed,
        failed: lFailed,
        flaky: lFlaky,
        skipped: lSkipped,
        passRate: lPassRate
      },
      tests,
      runsHistory,
      ...(effectiveZipPayload ? { playwrightZip: effectiveZipPayload } : {}),
      ...(effectiveZipUrl ? { playwrightZipUrl: effectiveZipUrl } : {})
    };

    // Commit Layer to Firestore
    await layerRef.set(updatedLayerPayload, { merge: true });
    console.log(`✅ Saved layer [${projectId} / ${currentLayer}] to Firestore.`);
    if (effectiveZipUrl) {
      console.log(`📦 Playwright zip archive linked: ${effectiveZipPayload?.fileName || 'playwright-report.zip'}`);
    }

    currentLayers[currentLayer] = {
      name: updatedLayerPayload.layerName,
      total: lTotal,
      passed: lPassed,
      failed: lFailed,
      flaky: lFlaky,
      skipped: lSkipped,
      passRate: lPassRate,
      ...(effectiveZipPayload ? { playwrightZip: effectiveZipPayload } : {}),
      ...(effectiveZipUrl ? { playwrightZipUrl: effectiveZipUrl } : {})
    };
  }

  // Update Project Manifest
  const layersList = Object.values(currentLayers);
  const mTotal = layersList.reduce((acc, l) => acc + (l.total || 0), 0);
  const mPassed = layersList.reduce((acc, l) => acc + (l.passed || 0), 0);
  const mFailed = layersList.reduce((acc, l) => acc + (l.failed || 0), 0);
  const mFlaky = layersList.reduce((acc, l) => acc + (l.flaky || 0), 0);
  const mSkipped = layersList.reduce((acc, l) => acc + (l.skipped || 0), 0);
  const mPassRate = mTotal > 0 ? Number(((mPassed / mTotal) * 100).toFixed(1)) : 100;

  await projectRef.set(
    {
      projectId,
      projectName: existingProjData.projectName || projectId.toUpperCase(),
      lastUpdated: now.toISOString(),
      layers: currentLayers,
      summary: {
        total: mTotal,
        passed: mPassed,
        failed: mFailed,
        flaky: mFlaky,
        skipped: mSkipped,
        passRate: mPassRate
      }
    },
    { merge: true }
  );
  console.log(`✅ Updated project manifest [${projectId}] in Firestore.`);

  // Update Global Overview
  const summaryDoc = await summaryRef.get();
  if (summaryDoc.exists) {
    const summaryData = summaryDoc.data();
    if (!summaryData.projects) summaryData.projects = [];
    let projIdx = summaryData.projects.findIndex(p => p.id === projectId);
    if (projIdx < 0) {
      // First sync for this project — add it to the dashboard's project list
      // instead of silently skipping (this previously left newly-added
      // projects invisible in the nav until someone manually seeded them).
      summaryData.projects.push({
        id: projectId,
        name: existingProjData.projectName || projectId.toUpperCase(),
        layers: {}
      });
      projIdx = summaryData.projects.length - 1;
      console.log(`ℹ️ Added new project [${projectId}] to the dashboard's project list.`);
    }

    if (!summaryData.projects[projIdx].layers) summaryData.projects[projIdx].layers = {};
    for (const [lKey, lVal] of Object.entries(currentLayers)) {
      summaryData.projects[projIdx].layers[lKey] = lVal.passRate;
    }
    summaryData.projects[projIdx].lastUpdated = now.toISOString();
    summaryData.projects[projIdx].summary = {
      total: mTotal,
      passed: mPassed,
      failed: mFailed,
      flaky: mFlaky,
      skipped: mSkipped,
      passRate: mPassRate
    };

    const oTotal = summaryData.projects.reduce((acc, p) => acc + (p.summary?.total || 0), 0);
    const oPassed = summaryData.projects.reduce((acc, p) => acc + (p.summary?.passed || 0), 0);
    const oFailed = summaryData.projects.reduce((acc, p) => acc + (p.summary?.failed || 0), 0);
    const oFlaky = summaryData.projects.reduce((acc, p) => acc + (p.summary?.flaky || 0), 0);
    const oSkipped = summaryData.projects.reduce((acc, p) => acc + (p.summary?.skipped || 0), 0);
    const oPassRate = oTotal > 0 ? Number(((oPassed / oTotal) * 100).toFixed(1)) : 100;
    summaryData.overallSummary = {
      totalTests: oTotal,
      totalPassed: oPassed,
      totalFailed: oFailed,
      totalFlaky: oFlaky,
      totalSkipped: oSkipped,
      passRate: oPassRate
    };

    summaryData.lastUpdated = now.toISOString();
    await summaryRef.set(summaryData, { merge: true });
    console.log(`✅ Updated global summary in Firestore.`);
  }

  console.log(`🎉 Finished syncing test results for [${projectId}] to Firebase!`);
}

main().catch(err => {
  console.error('❌ Error executing push to Firebase:', err);
  process.exit(1);
});
