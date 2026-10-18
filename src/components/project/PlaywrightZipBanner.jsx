import React from 'react';
import { FileArchive, Download, ChevronRight, Info, Globe, Zap, Smartphone } from 'lucide-react';
import { formatBytes, formatUploadTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export default function PlaywrightZipBanner({
  selectedLayer,
  onSelectLayer,
  layers = {}
}) {
  const currentLayerData = selectedLayer !== 'all' ? (layers[selectedLayer] || {}) : null;
  const currentLayerZip = currentLayerData?.playwrightZip || null;
  const currentLayerZipUrl = currentLayerData?.playwrightZipUrl || currentLayerZip?.url || null;

  const availableLayerZips = ['web', 'api', 'mobile'].map(l => {
    const data = layers[l] || {};
    const zip = data.playwrightZip;
    const url = data.playwrightZipUrl || zip?.url;
    return {
      id: l,
      name: l === 'web' ? 'Web' : l === 'api' ? 'API' : 'Mobile',
      icon: l === 'web' ? Globe : l === 'api' ? Zap : Smartphone,
      zip,
      url,
      notConfigured: data.notConfigured
    };
  });

  if (selectedLayer !== 'all') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm transition">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                'p-2.5 rounded-lg border shrink-0',
                currentLayerZipUrl
                  ? 'bg-primary-50 text-primary-600 border-primary-200'
                  : 'bg-gray-100 text-gray-400 border-gray-200'
              )}
            >
              <FileArchive className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
                  Playwright Report Archive (.zip)
                </h3>
                <span
                  className={cn(
                    'text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border',
                    currentLayerZipUrl
                      ? 'bg-primary-50 text-primary-700 border-primary-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  )}
                >
                  {selectedLayer === 'web' ? 'Web' : selectedLayer === 'api' ? 'API' : 'Mobile'} Pipeline
                </span>
                {currentLayerZipUrl ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success-50 text-success-700 border border-success-200">
                    Ready for Download
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                    Awaiting Pipeline Upload
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 max-w-2xl">
                {currentLayerZipUrl
                  ? 'Interactive offline HTML report package containing trace recordings, network activity, DOM snapshots, and console logs.'
                  : `Downloadable Playwright test package for ${selectedLayer === 'web' ? 'Web' : selectedLayer === 'api' ? 'API' : 'Mobile'} pipeline. Upload a .zip during CI to enable one-click offline report downloads.`}
              </p>

              {/* Metadata tags if zip is available */}
              {currentLayerZip && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-500">
                  {currentLayerZip.fileName && (
                    <span className="font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                      {currentLayerZip.fileName}
                    </span>
                  )}
                  {formatBytes(currentLayerZip.sizeBytes) && (
                    <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                      {formatBytes(currentLayerZip.sizeBytes)}
                    </span>
                  )}
                  {currentLayerZip.uploadedAt && (
                    <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                      Uploaded {formatUploadTime(currentLayerZip.uploadedAt)}
                    </span>
                  )}
                  {currentLayerZip.runId && (
                    <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                      CI Run #{currentLayerZip.runId}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Download Action Button or Status */}
          <div className="shrink-0 flex items-center">
            {currentLayerZipUrl ? (
              <a
                href={currentLayerZipUrl}
                download={currentLayerZip?.fileName || `playwright-report-${selectedLayer}.zip`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-sm transition transform active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>Download Playwright Zip</span>
              </a>
            ) : (
              <div className="text-right">
                <span className="text-xs text-gray-400 block font-medium">No .zip uploaded</span>
                <span className="text-[10px] text-gray-400 font-mono">--zip-report {selectedLayer}-report.zip</span>
              </div>
            )}
          </div>
        </div>

        {/* Offline Tester Guidance Tip */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-start gap-2.5 text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
          <Info className="h-4 w-4 text-primary-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-gray-700">Tester Offline Instructions:</strong> Unzip the downloaded file anywhere on your computer and open <code className="bg-gray-200 text-primary-700 px-1.5 py-0.5 rounded font-mono text-[10px]">index.html</code> directly in your web browser (or run <code className="bg-gray-200 text-primary-700 px-1.5 py-0.5 rounded font-mono text-[10px]">npx playwright show-report</code>) to inspect failed step screenshots, execution traces, and video replays completely offline without any server setup.
          </div>
        </div>
      </div>
    );
  }

  // 'all' layer view: show grid of layer archives
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <FileArchive className="h-5 w-5 text-primary-500" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Playwright Offline Report Archives (.zip)</h3>
            <p className="text-xs text-gray-500">Download interactive test reports for offline examination across all pipelines</p>
          </div>
        </div>
        <span className="text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 font-medium">
          For Old School Testers &amp; Offline Audits
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {availableLayerZips.map(item => {
          const Icon = item.icon;
          const hasZip = Boolean(item.url);
          return (
            <div
              key={item.id}
              className={cn(
                'p-3.5 rounded-lg border transition flex flex-col justify-between gap-3',
                hasZip
                  ? 'bg-white border-gray-200 hover:border-primary-300'
                  : 'bg-gray-50 border-gray-200'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'p-1.5 rounded-lg border',
                      hasZip ? 'bg-primary-50 text-primary-600 border-primary-200' : 'bg-gray-100 text-gray-400 border-gray-200'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-xs text-gray-900">{item.name} Pipeline</span>
                </div>
                {hasZip ? (
                  <span className="text-[10px] font-semibold text-success-700 bg-success-50 border border-success-200 px-2 py-0.5 rounded-full">
                    Zip Ready
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                    No Archive
                  </span>
                )}
              </div>

              <div className="text-[11px] text-gray-500 min-h-[28px]">
                {hasZip ? (
                  <div className="space-y-0.5">
                    <div className="font-mono text-gray-600 truncate text-[10px]">
                      {item.zip?.fileName || `playwright-report-${item.id}.zip`}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {formatBytes(item.zip?.sizeBytes) ? `${formatBytes(item.zip?.sizeBytes)} • ` : ''}
                      {item.zip?.uploadedAt ? formatUploadTime(item.zip.uploadedAt) : 'Ready'}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400 text-[11px]">
                    {item.notConfigured ? 'Layer not configured' : 'Awaiting pipeline report upload'}
                  </span>
                )}
              </div>

              <div>
                {hasZip ? (
                  <a
                    href={item.url}
                    download={item.zip?.fileName || `playwright-report-${item.id}.zip`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .zip</span>
                  </a>
                ) : (
                  <button
                    onClick={() => onSelectLayer(item.id)}
                    className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 text-xs font-medium border border-gray-200 transition"
                  >
                    <span>Open {item.name} View</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
