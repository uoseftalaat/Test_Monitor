import React from 'react';
import { RefreshCw, Activity, Layers, Smartphone, Globe, Zap, AlertCircle } from 'lucide-react';

export default function Navbar({
  projects,
  selectedProject,
  onSelectProject,
  onRefresh,
  isRefreshing,
  lastUpdated,
  autoRefreshInterval,
  onChangeAutoRefresh
}) {
  const formatTime = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with branding and actions */}
        <div className="flex items-center justify-between h-16 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">TestMonitor</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  QA Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-400">Automated Pipeline & Regression Monitoring</p>
            </div>
          </div>

          {/* Right controls: Last updated, Auto-refresh, Manual refresh */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Updated: <span className="text-slate-200 font-mono">{formatTime(lastUpdated)}</span></span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={autoRefreshInterval}
                onChange={(e) => onChangeAutoRefresh(Number(e.target.value))}
                className="text-xs bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700 rounded-lg px-2.5 py-1.5 outline-none transition focus:border-blue-500"
                title="Auto-refresh frequency"
              >
                <option value={0}>Auto: Off</option>
                <option value={30}>Auto: 30s</option>
                <option value={60}>Auto: 60s</option>
                <option value={300}>Auto: 5m</option>
              </select>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg shadow-sm shadow-blue-600/30 transition active:scale-95"
                title="Fetch latest test data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scalable Project Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none">
          <button
            onClick={() => onSelectProject('all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              selectedProject === 'all'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Projects</span>
          </button>

          {projects.map((proj) => {
            const hasFailures = proj.summary?.failed > 0;
            const isSelected = selectedProject === proj.id;

            return (
              <button
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap relative ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{proj.name}</span>
                {hasFailures ? (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {proj.summary.failed}
                  </span>
                ) : (
                  <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-blue-700 text-blue-100' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {proj.summary?.passRate}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
