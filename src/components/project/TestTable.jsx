import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Layers, ChevronRight } from 'lucide-react';
import { stripAnsi } from '../../utils/ansi';
import { cn } from '../../utils/cn';

export default function TestTable({
  tests = [],
  projectName = '',
  selectedLayer = 'all',
  statusFilter = 'all',
  totalFailed = 0,
  totalTests = 0,
  onSelectTest
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900 tracking-tight">Test Cases</h2>
          <span className="text-xs text-gray-500">({tests.length} matches)</span>
          {totalFailed > 0 && statusFilter === 'all' && (
            <span className="text-[11px] font-semibold text-destructive-600 bg-destructive-50 border border-destructive-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              {totalFailed} failure{totalFailed > 1 ? 's' : ''} on top
            </span>
          )}
        </div>
        {statusFilter === 'failed' && (
          <span className="text-xs font-semibold text-destructive-600 flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5" /> Showing failures requiring attention
          </span>
        )}
      </div>

      {tests.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          {totalTests === 0 ? (
            <>
              <Layers className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">
                {selectedLayer === 'all'
                  ? `No test runs recorded yet for ${projectName}`
                  : `No ${selectedLayer === 'web' ? 'Web' : selectedLayer === 'api' ? 'API' : 'Mobile'} tests configured for ${projectName}`}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {selectedLayer === 'all'
                  ? 'Test results will appear here automatically as soon as your GitHub Actions pipeline executes.'
                  : `As soon as the ${selectedLayer} pipeline runs, results will appear here automatically.`}
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-8 w-8 text-success-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">No matching test cases found</p>
              <p className="text-xs text-gray-500 mt-1">Try resetting the status filter or search term</p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Test Case / Suite</th>
                <th className="py-3 px-4">Layer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Health Bar</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600">
              {tests.map((test) => {
                const isFailed = test.currentStatus === 'failed';
                const isFlaky = test.currentStatus === 'flaky';
                const history = test.history30d || [];

                return (
                  <tr
                    key={test.id}
                    className={cn(
                      'hover:bg-gray-50 transition cursor-pointer group',
                      isFailed && 'bg-destructive-50/30'
                    )}
                    onClick={() => onSelectTest(test)}
                  >
                    {/* Title & Suite */}
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-semibold text-gray-900 group-hover:text-primary-600">
                        {test.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                        <span className="font-medium text-gray-500">{test.suite}</span>
                        {test.file && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-gray-400 truncate max-w-[200px]">{test.file}</span>
                          </>
                        )}
                      </div>
                      {/* If failed: show failure snippet right in the table row */}
                      {isFailed && test.latestError?.message && (
                        <div className="mt-2 text-[11px] font-mono text-destructive-600 bg-destructive-50 px-2 py-1 rounded border border-destructive-200 truncate max-w-lg">
                          {stripAnsi(test.latestError.message)}
                        </div>
                      )}
                    </td>

                    {/* Layer */}
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                        {test.layer}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase',
                          isFailed
                            ? 'bg-destructive-50 text-destructive-600 border border-destructive-200'
                            : isFlaky
                            ? 'bg-warning-50 text-warning-600 border border-warning-200'
                            : 'bg-success-50 text-success-600 border border-success-200'
                        )}
                      >
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
                            className={cn(
                              'h-4 w-1.5 rounded-sm',
                              h.status === 'passed'
                                ? 'bg-success-500'
                                : h.status === 'failed'
                                ? 'bg-destructive-500'
                                : h.status === 'flaky'
                                ? 'bg-warning-500'
                                : 'bg-gray-200'
                            )}
                          />
                        ))}
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 font-mono text-gray-500">
                      {test.durationMs ? `${(test.durationMs / 1000).toFixed(2)}s` : '-'}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTest(test);
                        }}
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition',
                          isFailed
                            ? 'bg-destructive-600 hover:bg-destructive-700 text-white shadow-sm'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        )}
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
  );
}
