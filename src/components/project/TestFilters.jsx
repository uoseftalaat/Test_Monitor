import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function TestFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedSuite,
  onSuiteChange,
  uniqueSuites = [],
  totalFailed = 0,
  totalFlaky = 0
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search test name, suite, spec file, or error message..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => onStatusFilterChange('all')}
            className={cn(
              'px-3 py-1 rounded-md font-medium transition',
              statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            All
          </button>
          <button
            onClick={() => onStatusFilterChange('failed')}
            className={cn(
              'px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5',
              statusFilter === 'failed' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-red-400'
            )}
          >
            <span>Failed</span>
            {totalFailed > 0 && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full',
                  statusFilter === 'failed' ? 'bg-red-700' : 'bg-red-500/20 text-red-400'
                )}
              >
                {totalFailed}
              </span>
            )}
          </button>
          <button
            onClick={() => onStatusFilterChange('flaky')}
            className={cn(
              'px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5',
              statusFilter === 'flaky' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-amber-400'
            )}
          >
            <span>Flaky</span>
            {totalFlaky > 0 && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full',
                  statusFilter === 'flaky' ? 'bg-amber-700' : 'bg-amber-500/20 text-amber-400'
                )}
              >
                {totalFlaky}
              </span>
            )}
          </button>
          <button
            onClick={() => onStatusFilterChange('passed')}
            className={cn(
              'px-3 py-1 rounded-md font-medium transition',
              statusFilter === 'passed' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-400'
            )}
          >
            Passed
          </button>
        </div>

        {/* Suite Dropdown */}
        {uniqueSuites.length > 0 && (
          <select
            value={selectedSuite}
            onChange={(e) => onSuiteChange(e.target.value)}
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
  );
}
