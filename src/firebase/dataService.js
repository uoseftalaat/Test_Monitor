import { doc, collection, onSnapshot, getDoc, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { LAYER_KEYS } from '../constants/layers';
import { STATUS_PRIORITY } from '../constants/status';

// Helper to normalize and sort tests & history
export function processProjectLayers(projectId, manifestDoc, layersData) {
  const layerKeys = LAYER_KEYS;
  const loadedLayers = {};
  let combinedTests = [];
  const combinedRunsHistoryMap = {};

  layerKeys.forEach(layerKey => {
    const layer = layersData[layerKey];
    const isNotConfigured = manifestDoc?.layers?.[layerKey]?.notConfigured;

    const rawZip = (layer && typeof layer === 'object' ? layer.playwrightZip : null) || manifestDoc?.layers?.[layerKey]?.playwrightZip || null;
    const rawZipUrl = (layer && typeof layer === 'object' ? layer.playwrightZipUrl : null) || manifestDoc?.layers?.[layerKey]?.playwrightZipUrl || (typeof rawZip === 'string' ? rawZip : rawZip?.url) || null;
    const normalizedZip = rawZip
      ? (typeof rawZip === 'string' ? { url: rawZip, fileName: `playwright-report-${layerKey}.zip` } : { ...rawZip, url: rawZip.url || rawZipUrl })
      : (rawZipUrl ? { url: rawZipUrl, fileName: `playwright-report-${layerKey}.zip` } : null);

    if (layer && typeof layer === 'object') {
      loadedLayers[layerKey] = {
        ...(layer.summary || { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 }),
        runsHistory: layer.runsHistory || [],
        playwrightReport: layer.playwrightReport || null,
        playwrightZip: normalizedZip,
        playwrightZipUrl: rawZipUrl,
        notConfigured: !!isNotConfigured
      };

      if (Array.isArray(layer.tests) && layer.tests.length > 0) {
        combinedTests = combinedTests.concat(layer.tests);
      }

      (layer.runsHistory || []).forEach(r => {
        if (!combinedRunsHistoryMap[r.date]) {
          combinedRunsHistoryMap[r.date] = { date: r.date, total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0 };
        }
        combinedRunsHistoryMap[r.date].total += r.total || 0;
        combinedRunsHistoryMap[r.date].passed += r.passed || 0;
        combinedRunsHistoryMap[r.date].failed += r.failed || 0;
        combinedRunsHistoryMap[r.date].flaky += r.flaky || 0;
        combinedRunsHistoryMap[r.date].skipped += r.skipped || 0;
      });
    } else {
      loadedLayers[layerKey] = {
        total: 0,
        passed: 0,
        failed: 0,
        flaky: 0,
        skipped: 0,
        passRate: 100,
        notConfigured: true,
        runsHistory: [],
        playwrightReport: null,
        playwrightZip: normalizedZip,
        playwrightZipUrl: rawZipUrl
      };
    }
  });

  const combinedRunsHistory = Object.values(combinedRunsHistoryMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({
      ...r,
      passRate: r.total > 0 ? Number(((r.passed / r.total) * 100).toFixed(1)) : 100
    }));

  const totalTests = combinedTests.length;
  const totalPassed = combinedTests.filter(t => t.currentStatus === 'passed').length;
  const totalFailed = combinedTests.filter(t => t.currentStatus === 'failed').length;
  const totalFlaky = combinedTests.filter(t => t.currentStatus === 'flaky').length;
  const totalSkipped = combinedTests.filter(t => t.currentStatus === 'skipped').length;
  const overallPassRate = totalTests > 0 ? Number(((totalPassed / totalTests) * 100).toFixed(1)) : 100;

  combinedTests.sort((a, b) => {
    const pA = STATUS_PRIORITY[a.currentStatus] ?? 99;
    const pB = STATUS_PRIORITY[b.currentStatus] ?? 99;
    if (pA !== pB) return pA - pB;
    return (a.title || '').localeCompare(b.title || '');
  });

  return {
    projectId,
    projectName: manifestDoc?.projectName || projectId.toUpperCase(),
    description: manifestDoc?.description || '',
    repoUrl: manifestDoc?.repoUrl || '',
    summary: {
      total: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      flaky: totalFlaky,
      skipped: totalSkipped,
      passRate: overallPassRate
    },
    layers: loadedLayers,
    tests: combinedTests,
    runsHistory: combinedRunsHistory
  };
}

// ---------------------------------------------------------------------------
// Realtime Firestore Subscriptions
// ---------------------------------------------------------------------------

export function subscribeToGlobalSummary(onData, onError) {
  if (!isFirebaseConfigured() || !db) {
    if (onError) onError(new Error('Firebase is not configured'));
    return () => {};
  }

  const summaryRef = doc(db, 'projects-summary', 'overview');
  return onSnapshot(
    summaryRef,
    snapshot => {
      if (snapshot.exists()) {
        onData(snapshot.data());
      } else {
        if (onError) onError(new Error('No summary document found in Firestore'));
      }
    },
    err => {
      if (err.code !== 'permission-denied') {
        console.error('Firestore global summary snapshot error:', err);
      }
      if (onError) onError(err);
    }
  );
}

export function subscribeToProject(projectId, onData, onError) {
  if (!isFirebaseConfigured() || !db || projectId === 'all') {
    if (onError) onError(new Error('Firebase not configured or invalid project'));
    return () => {};
  }

  const projectDocRef = doc(db, 'projects', projectId);
  const layersColRef = collection(db, 'projects', projectId, 'layers');

  let manifestData = null;
  let layersMap = {};
  let manifestLoaded = false;
  let layersLoaded = false;
  let isUnsubscribed = false;

  const emitIfReady = () => {
    if (!isUnsubscribed && manifestLoaded && layersLoaded) {
      const payload = processProjectLayers(projectId, manifestData, layersMap);
      onData(payload);
    }
  };

  const unsubManifest = onSnapshot(
    projectDocRef,
    snap => {
      manifestData = snap.exists() ? snap.data() : null;
      manifestLoaded = true;
      emitIfReady();
    },
    err => {
      if (err.code !== 'permission-denied') {
        console.warn(`Firestore manifest error for ${projectId}:`, err);
        manifestLoaded = true;
        emitIfReady();
      }
    }
  );

  const unsubLayers = onSnapshot(
    layersColRef,
    querySnap => {
      layersMap = {};
      querySnap.forEach(d => {
        layersMap[d.id] = d.data();
      });
      layersLoaded = true;
      emitIfReady();
    },
    err => {
      if (err.code !== 'permission-denied') {
        console.warn(`Firestore layers error for ${projectId}:`, err);
      }
      if (onError) onError(err);
    }
  );

  return () => {
    isUnsubscribed = true;
    unsubManifest();
    unsubLayers();
  };
}

// ---------------------------------------------------------------------------
// Fallback local fetchers (used when Firebase is unconfigured or offline)
// ---------------------------------------------------------------------------

export async function fetchLocalGlobalSummary() {
  const cacheBuster = `t=${Date.now()}`;
  const summaryRes = await fetch(`./data/projects-summary.json?${cacheBuster}`);
  if (!summaryRes.ok) throw new Error('Local summary file not found');
  return await summaryRes.json();
}

export async function fetchLocalProject(projectId) {
  const cacheBuster = `t=${Date.now()}`;
  let manifest = null;
  try {
    const manifestRes = await fetch(`./data/projects/${projectId}/manifest.json?${cacheBuster}`);
    if (manifestRes.ok) manifest = await manifestRes.json();
  } catch (_) {}

  const layerKeys = LAYER_KEYS;
  const layerResponses = await Promise.allSettled(
    layerKeys.map(layer =>
      fetch(`./data/projects/${projectId}/${layer}.json?${cacheBuster}`)
        .then(res => (res.ok ? res.json().catch(() => null) : null))
        .catch(() => null)
    )
  );

  const layersMap = {};
  layerKeys.forEach((key, idx) => {
    const res = layerResponses[idx];
    if (res.status === 'fulfilled' && res.value) {
      layersMap[key] = res.value;
    }
  });

  return processProjectLayers(projectId, manifest, layersMap);
}
