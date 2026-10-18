import React, { useState, useEffect } from 'react';
import AnsiText from './common/AnsiText';
import { stripAnsi } from '../utils/ansi';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileCode,
  Copy,
  Check,
  Calendar,
  History,
  Terminal,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function TestDetailModal({ test, onClose }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!test) return null;

  const handleCopyStack = () => {
    if (test.latestError?.stack) {
      navigator.clipboard.writeText(stripAnsi(test.latestError.stack));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isFailed = test.currentStatus === 'failed';
  const isFlaky = test.currentStatus === 'flaky';
  const isPassed = test.currentStatus === 'passed';

  const history = test.history30d || [];
  const totalHistoryRuns = history.length;
  const historyFailures = history.filter(h => h.status === 'failed').length;
  const historyFlaky = history.filter(h => h.status === 'flaky').length;
  const historySuccessRate = totalHistoryRuns > 0
    ? (((totalHistoryRuns - historyFailures) / totalHistoryRuns) * 100).toFixed(1)
    : 100;

  // Determine error category
  const getErrorType = (msg = '') => {
    const cleanMsg = stripAnsi(msg);
    const lower = cleanMsg.toLowerCase();
    if (
      lower.includes('assertionerror') ||
      lower.includes('expect(') ||
      (lower.includes('expected') && lower.includes('received')) ||
      (lower.includes('expected') && lower.includes('failed'))
    ) {
      return 'Assertion Failure';
    }
    if (lower.includes('timeouterror') || lower.includes('timed out') || lower.includes('timeout')) {
      return 'Timeout / Latency';
    }
    if (lower.includes('500') || lower.includes('internal server error') || lower.includes('deadlock')) return 'Backend 500 / Deadlock';
    if (lower.includes('targetclosed') || lower.includes('crash')) return 'Browser / Session Crash';
    if (lower.includes('migration') || lower.includes('sql') || lower.includes('database')) return 'Database Migration';
    return 'Execution Error';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white border border-gray-200 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                isFailed
                  ? 'bg-destructive-50 text-destructive-600 border border-destructive-200'
                  : isFlaky
                  ? 'bg-warning-50 text-warning-600 border border-warning-200'
                  : 'bg-success-50 text-success-600 border border-success-200'
              }`}>
                {isFailed && <XCircle className="h-3.5 w-3.5" />}
                {isFlaky && <AlertTriangle className="h-3.5 w-3.5" />}
                {isPassed && <CheckCircle2 className="h-3.5 w-3.5" />}
                {test.currentStatus}
              </span>

              <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                {test.layer}
              </span>

              <span className="text-xs text-gray-500 truncate max-w-xs">
                {test.suite}
              </span>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 break-words">
              {test.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
              {test.file && (
                <div className="flex items-center gap-1.5 font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                  <FileCode className="h-3.5 w-3.5 text-primary-500" />
                  <span className="truncate max-w-md">{test.file}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span>{test.durationMs ? `${(test.durationMs / 1000).toFixed(2)}s` : '-'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span>Last run: {test.lastRunAt ? new Date(test.lastRunAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="px-6 border-b border-gray-200 flex gap-4 text-xs font-semibold bg-white">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Failure Analysis &amp; Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Execution History ({totalHistoryRuns})</span>
            {historyFailures > 0 && (
              <span className="bg-destructive-50 text-destructive-600 text-[10px] px-1.5 py-0.2 rounded-full">
                {historyFailures} fails
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50">
          {activeTab === 'overview' ? (
            <>
              {/* If FAILED: Show exact error reason and stack trace */}
              {test.latestError ? (
                <div className="space-y-4">
                  {/* Error Alert Box */}
                  <div className="bg-destructive-50 border border-destructive-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-destructive-600 font-semibold text-xs uppercase tracking-wider">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Failure Reason — {getErrorType(test.latestError.message)}</span>
                      </div>
                      <span className="text-[11px] text-destructive-400 font-mono">
                        Pipeline Diagnostic
                      </span>
                    </div>
                    <p className="text-sm font-mono text-gray-900 bg-white p-3 rounded-lg border border-destructive-100 break-words whitespace-pre-wrap leading-relaxed">
                      {stripAnsi(test.latestError.message)}
                    </p>
                  </div>

                  {/* Failing Step */}
                  {test.latestError.step && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                        Failing Step / Action
                      </span>
                      <pre className="font-mono text-xs text-amber-300 bg-gray-900 p-3.5 rounded-lg border border-gray-800 overflow-x-auto leading-relaxed">
                        <AnsiText text={test.latestError.step} />
                      </pre>
                    </div>
                  )}

                  {/* Stack Trace */}
                  {test.latestError.stack && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Terminal className="h-3.5 w-3.5 text-primary-500" />
                          <span>Stack Trace</span>
                        </span>
                        <button
                          onClick={handleCopyStack}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded border border-gray-200 transition"
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-success-500" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copied ? 'Copied' : 'Copy Trace'}</span>
                        </button>
                      </div>
                      <pre className="font-mono text-xs text-slate-200 bg-gray-900 p-4 rounded-lg overflow-x-auto max-h-72 leading-relaxed border border-gray-800 selection:bg-primary-600">
                        <AnsiText text={test.latestError.stack} />
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-success-50 border border-success-200 rounded-lg p-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-success-500 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-900">Test Passed Successfully</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                    The latest execution passed all assertions within {test.durationMs ? `${(test.durationMs / 1000).toFixed(2)}s` : 'normal threshold'}. No errors or timeouts were encountered.
                  </p>
                </div>
              )}

              {/* Execution Health Timeline Bar */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Recent Health Bar
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {historySuccessRate}% reliability
                  </span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto py-1">
                  {history.map((h, i) => (
                    <div
                      key={i}
                      title={`${h.date}: ${h.status.toUpperCase()} (${h.durationMs}ms)${h.error ? ` - ${stripAnsi(h.error)}` : ''}`}
                      className={`h-7 flex-1 min-w-[8px] rounded-sm transition cursor-pointer hover:opacity-80 ${
                        h.status === 'passed' ? 'bg-success-500' : h.status === 'failed' ? 'bg-destructive-500' : h.status === 'flaky' ? 'bg-warning-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 font-mono">
                  <span>{history[0]?.date || 'First Run'}</span>
                  <span>{history[history.length - 1]?.date || 'Latest'}</span>
                </div>
              </div>
            </>
          ) : (
            /* Tab: Execution History */
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <span className="text-[11px] text-gray-500 uppercase">Recorded Runs</span>
                  <p className="text-xl font-bold text-gray-900 mt-1">{totalHistoryRuns}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <span className="text-[11px] text-gray-500 uppercase">Failed Runs</span>
                  <p className="text-xl font-bold text-destructive-600 mt-1">{historyFailures}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <span className="text-[11px] text-gray-500 uppercase">Success Rate</span>
                  <p className="text-xl font-bold text-success-600 mt-1">{historySuccessRate}%</p>
                </div>
              </div>

              {/* Table of all runs in the last month */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Run ID</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Duration</th>
                      <th className="py-2.5 px-4">Failure Reason / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-600">
                    {history.slice().reverse().map((run, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="py-2.5 px-4 font-mono text-gray-500">{run.date}</td>
                        <td className="py-2.5 px-4 font-mono text-primary-600">{run.runId}</td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            run.status === 'passed'
                              ? 'bg-success-50 text-success-600'
                              : run.status === 'failed'
                              ? 'bg-destructive-50 text-destructive-600'
                              : run.status === 'flaky'
                              ? 'bg-warning-50 text-warning-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-500 font-mono">
                          {run.durationMs ? `${(run.durationMs / 1000).toFixed(2)}s` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-gray-600 max-w-xs truncate" title={stripAnsi(run.error) || 'Passed without error'}>
                          {run.error ? (
                            <span className="text-destructive-600 font-mono text-[11px]">{stripAnsi(run.error)}</span>
                          ) : (
                            <span className="text-gray-400">Clean execution</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between text-xs text-gray-500">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[10px] border border-gray-200">ESC</kbd> to close</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
