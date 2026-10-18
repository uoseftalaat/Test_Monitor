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
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search test name, suite, spec file, or error message..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
        />
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status buttons */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs">
          <button
            onClick={() => onStatusFilterChange('all')}
            className={cn(
              'px-3 py-1 rounded-md font-medium transition',
              statusFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            )}
          >
            All
          </button>
          <button
            onClick={() => onStatusFilterChange('failed')}
            className={cn(
              'px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5',
              statusFilter === 'failed' ? 'bg-destructive-500 text-white' : 'text-gray-500 hover:text-destructive-600'
            )}
          >
            <span>Failed</span>
            {totalFailed > 0 && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full',
                  statusFilter === 'failed' ? 'bg-destructive-700' : 'bg-destructive-50 text-destructive-600'
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
              statusFilter === 'flaky' ? 'bg-warning-500 text-white' : 'text-gray-500 hover:text-warning-600'
            )}
          >
            <span>Flaky</span>
            {totalFlaky > 0 && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full',
                  statusFilter === 'flaky' ? 'bg-warning-700' : 'bg-warning-50 text-warning-600'
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
              statusFilter === 'passed' ? 'bg-success-600 text-white' : 'text-gray-500 hover:text-success-600'
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
            className="bg-white text-gray-600 border border-gray-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-primary-500 transition"
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
