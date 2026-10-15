import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import GlobalOverview from './components/GlobalOverview';
import ProjectView from './components/ProjectView';
import TestDetailModal from './components/TestDetailModal';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [selectedProjectId, setSelectedProjectId] = useState('arm'); // Default to ARM
  const [globalSummary, setGlobalSummary] = useState(null);
  const [currentProjectData, setCurrentProjectData] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(60); // seconds (default 60s)

  // Fetch summary and project data with cache-busting timestamp
  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const cacheBuster = `t=${Date.now()}`;
      // Load global summary
      const summaryRes = await fetch(`./data/projects-summary.json?${cacheBuster}`);
      if (!summaryRes.ok) throw new Error(`Failed to load summary (HTTP ${summaryRes.status})`);
      const summaryData = await summaryRes.json();
      setGlobalSummary(summaryData);

      // If a specific project is selected, load its detailed data
      if (selectedProjectId !== 'all') {
        const projRes = await fetch(`./data/projects/${selectedProjectId}.json?${cacheBuster}`);
        if (!projRes.ok) throw new Error(`Failed to load project ${selectedProjectId} (HTTP ${projRes.status})`);
        const projData = await projRes.json();
        setCurrentProjectData(projData);
      }

      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Error fetching test monitoring data:', err);
      setErrorMessage(err.message || 'Failed to fetch test monitoring data');
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
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-between text-red-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
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
          <span>Automated by GitHub Actions • 30-Day Failure Retention</span>
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
