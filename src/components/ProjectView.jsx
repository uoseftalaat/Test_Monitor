import React, { useState, useMemo } from 'react';
import { stripAnsi } from '../utils/ansi.jsx';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  ExternalLink,
  Globe,
  Zap,
  Smartphone,
  Layers,
  ChevronRight,
  FileCode,
  Flame
} from 'lucide-react';

export default function ProjectView({ projectData, onSelectTest }) {
  const [selectedLayer, setSelectedLayer] = useState('all'); // 'all' | 'web' | 'api' | 'android' | 'ios'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'failed' | 'flaky' | 'passed' | 'skipped'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuite, setSelectedSuite] = useState('all');

  if (!projectData) return null;

  const {
    projectName,
    description,
    repoUrl,
    summary,
    layers = {},
    tests = [],
    runsHistory = []
  } = projectData;

  // Status priority for listing order: failed (0) -> flaky (1) -> passed (2) -> skipped (3)
  const STATUS_PRIORITY = {
    failed: 0,
    flaky: 1,
    passed: 2,
    skipped: 3
  };

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
      // Secondary sort: Keep consistent alphabetical order by suite and title
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

  const layerTabs = [
    { id: 'all', name: 'All Layers', icon: Layers, count: tests.length },
    { id: 'web', name: 'Web', icon: Globe, count: layers.web?.total || 0, passRate: layers.web?.passRate, failed: layers.web?.failed },
    { id: 'api', name: 'API', icon: Zap, count: layers.api?.total || 0, passRate: layers.api?.passRate, failed: layers.api?.failed },
    { id: 'mobile', name: 'Mobile', icon: Smartphone, count: layers.mobile?.total || 0, passRate: layers.mobile?.passRate, failed: layers.mobile?.failed },
  ];

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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Project Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{projectName}</h1>
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20"
                >
                  <span>Repository</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Layer Health</span>
              <span className="text-2xl font-extrabold text-white">{currentSummary?.passRate || 0}%</span>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center font-bold text-xs bg-slate-950">
              <span className={currentSummary?.passRate >= 95 ? 'text-emerald-400' : 'text-amber-400'}>
                {currentSummary?.passRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Layer Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto mt-6 pt-5 border-t border-slate-800/80 scrollbar-none">
          {layerTabs.map(tab => {
            const Icon = tab.icon;
            const isSelected = selectedLayer === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedLayer(tab.id);
                  setSelectedSuite('all');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  {tab.count}
                </span>
                {tab.failed > 0 && (
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Tests</span>
          <p className="text-2xl font-bold text-white mt-1">{currentSummary?.total || 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold">Passed</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{currentSummary?.passed || 0}</p>
        </div>
        <div className={`bg-slate-900 border rounded-xl p-4 ${totalFailedInLayer > 0 ? 'border-red-500/40 bg-red-950/10' : 'border-slate-800'}`}>
          <span className="text-xs text-red-400 uppercase font-semibold">Failed</span>
          <p className="text-2xl font-bold text-red-400 mt-1">{totalFailedInLayer}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-amber-400 uppercase font-semibold">Flaky / Retried</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{totalFlakyInLayer}</p>
        </div>
      </div>

      {/* Daily Playwright Report Section */}
      <div className="space-y-3">
        {activePlaywrightReports.length > 0 ? (
          activePlaywrightReports.map((report, idx) => (
            <div 
              key={idx}
              className="bg-slate-900 border border-red-500/40 rounded-xl p-5 shadow-lg shadow-red-500/5 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Daily Playwright Report</h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                        {report.layerName}: {report.failedCount} Failed Test{report.failedCount > 1 ? 's' : ''} Today
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Recorded on {report.date} {report.runId ? `(CI Run #${report.runId})` : ''}
                    </p>
                  </div>
                </div>

                {report.reportUrl && (
                  <a
                    href={report.reportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition shadow-sm"
                  >
                    <span>Open Playwright HTML Report</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {/* Highlights of failing tests */}
              {report.failedTests && report.failedTests.length > 0 && (
                <div className="mt-3 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Failed Tests in Today's Report
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {report.failedTests.map((ft, fIdx) => {
                      const fullTest = tests.find(t => t.id === ft.id);
                      return (
                        <div
                          key={fIdx}
                          onClick={() => fullTest && onSelectTest(fullTest)}
                          className="p-3 rounded-lg bg-slate-950/80 border border-red-500/20 hover:border-red-500/50 cursor-pointer transition flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-red-400 font-mono text-[11px] font-semibold">{ft.suite}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-200 font-semibold truncate">{ft.title}</span>
                            </div>
                            {ft.errorMessage && (
                              <p className="text-[11px] text-red-300/80 font-mono mt-1 line-clamp-1">
                                {stripAnsi(ft.errorMessage)}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-[11px] text-blue-400 underline hover:text-blue-300">
                            View Failure Logs →
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <FileCode className="h-4 w-4 text-emerald-400" />
              <span>
                Daily Playwright Report: <strong className="text-slate-300 font-semibold">Clean Run</strong> — No failures reported today ({new Date().toISOString().split('T')[0]}).
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
              Section Empty (All Passed)
            </span>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search test name, suite, spec file, or error message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                statusFilter === 'failed' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <span>Failed</span>
              {totalFailedInLayer > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'failed' ? 'bg-red-700' : 'bg-red-500/20 text-red-400'}`}>
                  {totalFailedInLayer}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('flaky')}
              className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                statusFilter === 'flaky' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <span>Flaky</span>
              {totalFlakyInLayer > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'flaky' ? 'bg-amber-700' : 'bg-amber-500/20 text-amber-400'}`}>
                  {totalFlakyInLayer}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('passed')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                statusFilter === 'passed' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Passed
            </button>
          </div>

          {/* Suite Dropdown */}
          {uniqueSuites.length > 0 && (
            <select
              value={selectedSuite}
              onChange={(e) => setSelectedSuite(e.target.value)}
              className="bg-slate-950 text-slate-300 border border-slate-800 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition"
            >
              <option value="all">All Suites ({uniqueSuites.length})</option>
              {uniqueSuites.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">Test Cases</h2>
            <span className="text-xs text-slate-400">({filteredTests.length} matches)</span>
            {totalFailedInLayer > 0 && statusFilter === 'all' && (
              <span className="text-[11px] font-semibold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {totalFailedInLayer} failure{totalFailedInLayer > 1 ? 's' : ''} on top
              </span>
            )}
          </div>
          {statusFilter === 'failed' && (
            <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5" /> Showing failures requiring attention
            </span>
          )}
        </div>

        {filteredTests.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            {currentSummary?.total === 0 ? (
              <>
                <Layers className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-200">
                  {selectedLayer === 'all'
                    ? `No test runs recorded yet for ${projectName}`
                    : `No ${selectedLayer === 'web' ? 'Web' : selectedLayer === 'api' ? 'API' : 'Mobile'} tests configured for ${projectName}`}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {selectedLayer === 'all'
                    ? 'Test results will appear here automatically as soon as your GitHub Actions pipeline executes.'
                    : `As soon as the ${selectedLayer} pipeline runs, results will appear here automatically.`}
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">No matching test cases found</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting the status filter or search term</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/40 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Test Case / Suite</th>
                  <th className="py-3 px-4">Layer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Health Bar</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTests.map((test) => {
                  const isFailed = test.currentStatus === 'failed';
                  const isFlaky = test.currentStatus === 'flaky';
                  const history = test.history30d || [];

                  return (
                    <tr 
                      key={test.id} 
                      className={`hover:bg-slate-800/40 transition cursor-pointer ${
                        isFailed ? 'bg-red-950/10' : ''
                      }`}
                      onClick={() => onSelectTest(test)}
                    >
                      {/* Title & Suite */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-semibold text-white group-hover:text-blue-400">
                          {test.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="font-medium text-slate-400">{test.suite}</span>
                          {test.file && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-500 truncate max-w-[200px]">{test.file}</span>
                            </>
                          )}
                        </div>
                        {/* If failed: show failure snippet right in the table row */}
                        {isFailed && test.latestError?.message && (
                          <div className="mt-2 text-[11px] font-mono text-red-300 bg-red-950/30 px-2 py-1 rounded border border-red-900/40 truncate max-w-lg">
                            {stripAnsi(test.latestError.message)}
                          </div>
                        )}
                      </td>

                      {/* Layer */}
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {test.layer}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                          isFailed
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : isFlaky
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isFailed && <XCircle className="h-3 w-3" />}
                          {isFlaky && <AlertTriangle className="h-3 w-3" />}
                          {!isFailed && !isFlaky && <CheckCircle2 className="h-3 w-3" />}
                          <span>{test.currentStatus}</span>
                        </span>
                      </td>

                      {/* 30-Day Sparkline */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-0.5">
                          {history.slice(-20).map((h, i) => (
                            <div 
                              key={i}
                              title={`${h.date}: ${h.status.toUpperCase()}`}
                              className={`h-4 w-1.5 rounded-sm ${
                                h.status === 'passed' ? 'bg-emerald-500' : h.status === 'failed' ? 'bg-red-500' : h.status === 'flaky' ? 'bg-amber-500' : 'bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {test.durationMs ? `${(test.durationMs / 1000).toFixed(2)}s` : '-'}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTest(test);
                          }}
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                            isFailed 
                              ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-600/30' 
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          <span>{isFailed ? 'Inspect Failure' : 'Details'}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
