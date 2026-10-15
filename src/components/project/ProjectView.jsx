import React, { useState, useMemo } from 'react';
import { stripAnsi } from '../../utils/ansi';
import { STATUS_PRIORITY } from '../../constants/status';
import ProjectHeader from './ProjectHeader';
import LayerTabs from './LayerTabs';
import ProjectKpiGrid from './ProjectKpiGrid';
import PlaywrightZipBanner from './PlaywrightZipBanner';
import DailyFailures from './DailyFailures';
import TestFilters from './TestFilters';
import TestTable from './TestTable';

export default function ProjectView({ projectData, onSelectTest }) {
  const [selectedLayer, setSelectedLayer] = useState('all'); // 'all' | 'web' | 'api' | 'mobile'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'failed' | 'flaky' | 'passed' | 'skipped'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuite, setSelectedSuite] = useState('all');

  const {
    projectName = '',
    description = '',
    repoUrl = '',
    summary = { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 },
    layers = {},
    tests = []
  } = projectData || {};

  // Filter tests by layer, status, suite, and search query, then sort failures on top
  const filteredTests = useMemo(() => {
    const list = tests.filter(test => {
      // Layer filter
      if (selectedLayer !== 'all' && test.layer !== selectedLayer) return false;

      // Status filter
      if (statusFilter === 'failed' && test.currentStatus !== 'failed') return false;
      if (statusFilter === 'flaky' && test.currentStatus !== 'flaky') return false;
      if (statusFilter === 'passed' && test.currentStatus !== 'passed') return false;
      if (statusFilter === 'skipped' && test.currentStatus !== 'skipped') return false;

      // Suite filter
      if (selectedSuite !== 'all' && test.suite !== selectedSuite) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = test.title?.toLowerCase().includes(q);
        const matchesSuite = test.suite?.toLowerCase().includes(q);
        const matchesFile = test.file?.toLowerCase().includes(q);
        const cleanError = stripAnsi(test.latestError?.message).toLowerCase();
        const matchesError = cleanError.includes(q);
        if (!matchesTitle && !matchesSuite && !matchesFile && !matchesError) return false;
      }

      return true;
    });

    // Sort: Fails first (0), then Flaky (1), then Passed (2), then Skipped (3)
    return list.sort((a, b) => {
      const pA = STATUS_PRIORITY[a.currentStatus] ?? 99;
      const pB = STATUS_PRIORITY[b.currentStatus] ?? 99;
      if (pA !== pB) return pA - pB;
      const suiteCmp = (a.suite || '').localeCompare(b.suite || '');
      if (suiteCmp !== 0) return suiteCmp;
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [tests, selectedLayer, statusFilter, selectedSuite, searchQuery]);

  // Unique suites for dropdown
  const uniqueSuites = useMemo(() => {
    const relevantTests = selectedLayer === 'all'
      ? tests
      : tests.filter(t => t.layer === selectedLayer);
    return Array.from(new Set(relevantTests.map(t => t.suite))).filter(Boolean);
  }, [tests, selectedLayer]);

  // Current stats based on selectedLayer
  const currentSummary = useMemo(() => {
    if (selectedLayer === 'all') return summary;
    return layers[selectedLayer] || { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 };
  }, [summary, layers, selectedLayer]);

  const totalFailedInLayer = useMemo(() => {
    const list = selectedLayer === 'all' ? tests : tests.filter(t => t.layer === selectedLayer);
    return list.filter(t => t.currentStatus === 'failed').length;
  }, [tests, selectedLayer]);

  const totalFlakyInLayer = useMemo(() => {
    const list = selectedLayer === 'all' ? tests : tests.filter(t => t.layer === selectedLayer);
    return list.filter(t => t.currentStatus === 'flaky').length;
  }, [tests, selectedLayer]);

  // Check for any Playwright reports with failures for today
  const activePlaywrightReports = useMemo(() => {
    const reports = [];
    if (selectedLayer === 'all') {
      ['web', 'api', 'mobile'].forEach(l => {
        if (layers[l]?.playwrightReport?.hasFailures) {
          reports.push({
            layer: l,
            layerName: l === 'web' ? 'Web' : l === 'api' ? 'API' : 'Mobile',
            ...layers[l].playwrightReport
          });
        }
      });
    } else {
      if (layers[selectedLayer]?.playwrightReport?.hasFailures) {
        reports.push({
          layer: selectedLayer,
          layerName: selectedLayer === 'web' ? 'Web' : selectedLayer === 'api' ? 'API' : 'Mobile',
          ...layers[selectedLayer].playwrightReport
        });
      }
    }
    return reports;
  }, [layers, selectedLayer]);

  if (!projectData) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Project Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <ProjectHeader
          projectName={projectName}
          description={description}
          repoUrl={repoUrl}
          passRate={currentSummary?.passRate || 0}
        />

        <LayerTabs
          selectedLayer={selectedLayer}
          onSelectLayer={(layerId) => {
            setSelectedLayer(layerId);
            setSelectedSuite('all');
          }}
          layers={layers}
          totalTests={tests.length}
        />
      </div>

      {/* KPI Stats Row */}
      <ProjectKpiGrid
        summary={currentSummary}
        failedCount={totalFailedInLayer}
        flakyCount={totalFlakyInLayer}
      />

      {/* Playwright Offline Report & Zip Archive Section */}
      <PlaywrightZipBanner
        selectedLayer={selectedLayer}
        onSelectLayer={setSelectedLayer}
        layers={layers}
      />

      {/* Daily Playwright Report Section */}
      <DailyFailures
        activeReports={activePlaywrightReports}
        tests={tests}
        onSelectTest={onSelectTest}
      />

      {/* Filter & Search Bar */}
      <TestFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        selectedSuite={selectedSuite}
        onSuiteChange={setSelectedSuite}
        uniqueSuites={uniqueSuites}
        totalFailed={totalFailedInLayer}
        totalFlaky={totalFlakyInLayer}
      />

      {/* Test Cases Table */}
      <TestTable
        tests={filteredTests}
        projectName={projectName}
        selectedLayer={selectedLayer}
        statusFilter={statusFilter}
        totalFailed={totalFailedInLayer}
        totalTests={currentSummary?.total || 0}
        onSelectTest={onSelectTest}
      />
    </div>
  );
}
