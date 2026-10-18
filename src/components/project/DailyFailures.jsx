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
            className="bg-white border border-destructive-200 rounded-lg p-5 shadow-sm transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive-50 text-destructive-600 border border-destructive-200">
                  <FileCode className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">Daily Playwright Report</h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-destructive-50 text-destructive-600 border border-destructive-200">
                      {report.layerName}: {report.failedCount} Failed Test{report.failedCount > 1 ? 's' : ''} Today
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Recorded on {report.date} {report.runId ? `(Run #${report.runId})` : ''}
                  </p>
                </div>
              </div>

              {report.reportUrl && (
                <a
                  href={report.reportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-destructive-600 hover:bg-destructive-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  <span>Open Full Report</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            {/* Highlights of failing tests */}
            {report.failedTests && report.failedTests.length > 0 && (
              <div className="mt-3 space-y-2">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                  Failed Tests in Today's Report
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {report.failedTests.map((ft, fIdx) => {
                    const fullTest = tests.find(t => t.id === ft.id);
                    return (
                      <div
                        key={fIdx}
                        onClick={() => fullTest && onSelectTest(fullTest)}
                        className="p-3 rounded-lg bg-destructive-50/40 border border-destructive-100 hover:border-destructive-300 cursor-pointer transition flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-destructive-600 font-mono text-[11px] font-semibold">{ft.suite}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-800 font-semibold truncate">{ft.title}</span>
                          </div>
                          {ft.errorMessage && (
                            <p className="text-[11px] text-destructive-500 font-mono mt-1 line-clamp-1">
                              {stripAnsi(ft.errorMessage)}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-[11px] text-primary-600 underline hover:text-primary-700">
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
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-2.5 text-xs text-gray-500">
          <FileCode className="h-4 w-4 text-success-500" />
          <span>No failures reported today ({new Date().toISOString().split('T')[0]}).</span>
        </div>
      )}
    </div>
  );
}
