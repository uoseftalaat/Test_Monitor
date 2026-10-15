import React from 'react';
import { FileCode, ExternalLink } from 'lucide-react';
import { stripAnsi } from '../../utils/ansi';

export default function DailyFailures({
  activeReports = [],
  tests = [],
  onSelectTest
}) {
  return (
    <div className="space-y-3">
      {activeReports.length > 0 ? (
        activeReports.map((report, idx) => (
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
  );
}
