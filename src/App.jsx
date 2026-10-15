import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import GlobalOverview from './components/GlobalOverview';
import ProjectView from './components/ProjectView';
import TestDetailModal from './components/TestDetailModal';
import { Loader2, AlertCircle, Info } from 'lucide-react';

export default function App() {
  const [selectedProjectId, setSelectedProjectId] = useState('arm'); // Default to ARM
  const [globalSummary, setGlobalSummary] = useState(null);
  const [currentProjectData, setCurrentProjectData] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(60); // seconds (default 60s)

  // Fetch summary and decoupled per-layer project files with cache-busting timestamp & offline fallback
  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    setErrorMessage(null);

    const cacheKey = `test_monitor_cache_${selectedProjectId}`;

    try {
      const cacheBuster = `t=${Date.now()}`;
      
      // 1. Load global summary (fail-safe with fallback)
      let summaryData = null;
      try {
        const summaryRes = await fetch(`./data/projects-summary.json?${cacheBuster}`);
        if (summaryRes.ok) {
          summaryData = await summaryRes.json();
          setGlobalSummary(summaryData);
        }
      } catch (sumErr) {
        console.warn('Could not fetch global summary, using local cache if available', sumErr);
      }

      // 2. Load selected project layers (web, api, mobile)
      if (selectedProjectId !== 'all') {
        let manifest = null;
        try {
          const manifestRes = await fetch(`./data/projects/${selectedProjectId}/manifest.json?${cacheBuster}`);
          if (manifestRes.ok) manifest = await manifestRes.json();
        } catch (_) {}

        // Fetch web, api, and mobile in parallel with individual fail-safes
        const layerKeys = ['web', 'api', 'mobile'];
        const layerResponses = await Promise.allSettled(
          layerKeys.map(layer =>
            fetch(`./data/projects/${selectedProjectId}/${layer}.json?${cacheBuster}`)
              .then(res => {
                if (!res.ok) return null; // 404 or missing file is handled gracefully
                return res.json().catch(() => null); // Catch corrupted JSON
              })
              .catch(() => null)
          )
        );

        const loadedLayers = {};
        let combinedTests = [];
        let combinedRunsHistoryMap = {};
        let foundAnyLayer = false;

        layerKeys.forEach((key, idx) => {
          const result = layerResponses[idx];
          const isNotConfigured = manifest?.layers?.[key]?.notConfigured;

          if (result.status === 'fulfilled' && result.value && typeof result.value === 'object') {
            const data = result.value;
            loadedLayers[key] = {
              ...(data.summary || { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 }),
              runsHistory: data.runsHistory || [],
              playwrightReport: data.playwrightReport || null,
              notConfigured: !!isNotConfigured
            };
            
            if (Array.isArray(data.tests) && data.tests.length > 0) {
              combinedTests = combinedTests.concat(data.tests);
              foundAnyLayer = true;
            }

            // Merge runs history
            (data.runsHistory || []).forEach(r => {
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
            // Layer file doesn't exist (e.g. project has no mobile app yet) -> Safe empty fallback
            loadedLayers[key] = { 
              total: 0, 
              passed: 0, 
              failed: 0, 
              flaky: 0, 
              skipped: 0, 
              passRate: 100, 
              notConfigured: true,
              runsHistory: [],
              playwrightReport: null
            };
          }
        });

        // Fail-safe check: If all layer files were missing or 404, check local cache
        if (!foundAnyLayer) {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const cachedData = JSON.parse(cached);
              setCurrentProjectData(cachedData);
              setIsUsingCache(true);
              setIsLoading(false);
              setIsRefreshing(false);
              return;
            } catch (_) {}
          }
        }

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

        // Sort tests so failures are prioritized on top across all layers
        const STATUS_PRIORITY = { failed: 0, flaky: 1, passed: 2, skipped: 3 };
        combinedTests.sort((a, b) => {
          const pA = STATUS_PRIORITY[a.currentStatus] ?? 99;
          const pB = STATUS_PRIORITY[b.currentStatus] ?? 99;
          if (pA !== pB) return pA - pB;
          return (a.title || '').localeCompare(b.title || '');
        });

        const projectPayload = {
          projectId: selectedProjectId,
          projectName: manifest?.projectName || selectedProjectId.toUpperCase(),
          description: manifest?.description || '',
          repoUrl: manifest?.repoUrl || '',
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

        setCurrentProjectData(projectPayload);
        setIsUsingCache(false);

        // Save successfully loaded project data to cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify(projectPayload));
        } catch (_) {}
      }

      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Error fetching test monitoring data:', err);
      
      // Fallback to local cache if fetch fails completely
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setCurrentProjectData(JSON.parse(cached));
          setIsUsingCache(true);
        } catch (_) {
          setErrorMessage(err.message || 'Failed to fetch test monitoring data');
        }
      } else {
        setErrorMessage(err.message || 'Failed to fetch test monitoring data');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedProjectId]);

  // Initial load and on project change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;

    const timer = setInterval(() => {
      loadData(false);
    }, autoRefreshInterval * 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, loadData]);

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
  };

  const projectsList = globalSummary?.projects || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Sticky Header / Navigation */}
      <Navbar
        projects={projectsList}
        selectedProject={selectedProjectId}
        onSelectProject={handleSelectProject}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        autoRefreshInterval={autoRefreshInterval}
        onChangeAutoRefresh={setAutoRefreshInterval}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isUsingCache && (
          <div className="mb-4 p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-2 text-blue-300 text-xs">
            <Info className="h-4 w-4 text-blue-400 shrink-0" />
            <span>Displaying cached test records. Waiting for pipeline updates.</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-between text-red-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => loadData(true)}
              className="text-white bg-red-800/60 hover:bg-red-800 px-3 py-1 rounded-lg font-medium transition"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Loading test metrics and pipeline logs...</p>
          </div>
        ) : selectedProjectId === 'all' ? (
          <GlobalOverview
            globalSummary={globalSummary}
            onSelectProject={handleSelectProject}
          />
        ) : (
          <ProjectView
            projectData={currentProjectData}
            onSelectTest={setSelectedTest}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TestMonitor — QA Intelligence & Regression Tracking</span>
          <span>Web • API • Mobile • Automated by GitHub Actions • Continuous Monitoring</span>
        </div>
      </footer>

      {/* Test Detail / Pipeline Logs Replacement Modal */}
      {selectedTest && (
        <TestDetailModal
          test={selectedTest}
          onClose={() => setSelectedTest(null)}
        />
      )}
    </div>
  );
}
