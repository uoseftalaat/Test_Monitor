import React from 'react';
import { cn } from '../../utils/cn';

export default function ProjectKpiGrid({
  summary = { total: 0, passed: 0, failed: 0, flaky: 0 },
  failedCount = 0,
  flakyCount = 0
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <span className="text-xs text-gray-500 uppercase font-semibold">Total Tests</span>
        <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.total || 0}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <span className="text-xs text-gray-500 uppercase font-semibold">Passed</span>
        <p className="text-2xl font-bold text-success-600 mt-1">{summary?.passed || 0}</p>
      </div>
      <div
        className={cn(
          'bg-white border rounded-lg p-5',
          failedCount > 0 ? 'border-destructive-200 bg-destructive-50/40' : 'border-gray-200'
        )}
      >
        <span className="text-xs text-destructive-600 uppercase font-semibold">Failed</span>
        <p className="text-2xl font-bold text-destructive-600 mt-1">{failedCount}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <span className="text-xs text-warning-600 uppercase font-semibold">Flaky / Retried</span>
        <p className="text-2xl font-bold text-warning-600 mt-1">{flakyCount}</p>
      </div>
    </div>
  );
}
