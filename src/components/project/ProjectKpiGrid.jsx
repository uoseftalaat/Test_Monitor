import React from 'react';
import { cn } from '../../utils/cn';

export default function ProjectKpiGrid({
  summary = { total: 0, passed: 0, failed: 0, flaky: 0 },
  failedCount = 0,
  flakyCount = 0
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <span className="text-xs text-slate-400 uppercase font-semibold">Total Tests</span>
        <p className="text-2xl font-bold text-white mt-1">{summary?.total || 0}</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <span className="text-xs text-slate-400 uppercase font-semibold">Passed</span>
        <p className="text-2xl font-bold text-emerald-400 mt-1">{summary?.passed || 0}</p>
      </div>
      <div
        className={cn(
          'bg-slate-900 border rounded-xl p-4',
          failedCount > 0 ? 'border-red-500/40 bg-red-950/10' : 'border-slate-800'
        )}
      >
        <span className="text-xs text-red-400 uppercase font-semibold">Failed</span>
        <p className="text-2xl font-bold text-red-400 mt-1">{failedCount}</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <span className="text-xs text-amber-400 uppercase font-semibold">Flaky / Retried</span>
        <p className="text-2xl font-bold text-amber-400 mt-1">{flakyCount}</p>
      </div>
    </div>
  );
}
