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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm transition">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                'p-2.5 rounded-xl border shrink-0',
                currentLayerZipUrl
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-sm shadow-blue-500/10'
                  : 'bg-slate-800/60 text-slate-500 border-slate-800'
              )}
            >
              <FileArchive className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Playwright Report Archive (.zip)
                </h3>
                <span
                  className={cn(
                    'text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border',
                    currentLayerZipUrl
                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  )}
                >
                  {selectedLayer === 'web' ? 'Web' : selectedLayer === 'api' ? 'API' : 'Mobile'} Pipeline
                </span>
                {currentLayerZipUrl ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Ready for Download
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Awaiting Pipeline Upload
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 max-w-2xl">
                {currentLayerZipUrl
                  ? 'Interactive offline HTML report package containing trace recordings, network activity, DOM snapshots, and console logs.'
                  : `Downloadable Playwright test package for ${selectedLayer === 'web' ? 'Web' : selectedLayer === 'api' ? 'API' : 'Mobile'} pipeline. Upload a .zip during CI to enable one-click offline report downloads.`}
              </p>

              {/* Metadata tags if zip is available */}
              {currentLayerZip && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                  {currentLayerZip.fileName && (
                    <span className="font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {currentLayerZip.fileName}
                    </span>
                  )}
                  {formatBytes(currentLayerZip.sizeBytes) && (
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {formatBytes(currentLayerZip.sizeBytes)}
                    </span>
                  )}
                  {currentLayerZip.uploadedAt && (
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      Uploaded {formatUploadTime(currentLayerZip.uploadedAt)}
                    </span>
                  )}
                  {currentLayerZip.runId && (
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
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
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition transform active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>Download Playwright Zip</span>
              </a>
            ) : (
              <div className="text-right">
                <span className="text-xs text-slate-500 block font-medium">No .zip uploaded</span>
                <span className="text-[10px] text-slate-600 font-mono">--zip-report {selectedLayer}-report.zip</span>
              </div>
            )}
          </div>
        </div>

        {/* Offline Tester Guidance Tip */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
          <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-200">Tester Offline Instructions:</strong> Unzip the downloaded file anywhere on your computer and open <code className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded font-mono text-[10px]">index.html</code> directly in your web browser (or run <code className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded font-mono text-[10px]">npx playwright show-report</code>) to inspect failed step screenshots, execution traces, and video replays completely offline without any server setup.
          </div>
        </div>
      </div>
    );
  }

  // 'all' layer view: show grid of layer archives
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <FileArchive className="h-5 w-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Playwright Offline Report Archives (.zip)</h3>
            <p className="text-xs text-slate-400">Download interactive test reports for offline examination across all pipelines</p>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/60 font-medium">
          For Old School Testers & Offline Audits
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
                'p-3.5 rounded-xl border transition flex flex-col justify-between gap-3',
                hasZip
                  ? 'bg-slate-950/80 border-slate-800 hover:border-blue-500/40'
                  : 'bg-slate-950/40 border-slate-800/60'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'p-1.5 rounded-lg border',
                      hasZip ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-800/60 text-slate-500 border-slate-700/50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-xs text-white">{item.name} Pipeline</span>
                </div>
                {hasZip ? (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Zip Ready
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 bg-slate-800/40 border border-slate-800 px-2 py-0.5 rounded-full">
                    No Archive
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-400 min-h-[28px]">
                {hasZip ? (
                  <div className="space-y-0.5">
                    <div className="font-mono text-slate-300 truncate text-[10px]">
                      {item.zip?.fileName || `playwright-report-${item.id}.zip`}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formatBytes(item.zip?.sizeBytes) ? `${formatBytes(item.zip?.sizeBytes)} • ` : ''}
                      {item.zip?.uploadedAt ? formatUploadTime(item.zip.uploadedAt) : 'Ready'}
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-500 text-[11px]">
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
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .zip</span>
                  </a>
                ) : (
                  <button
                    onClick={() => onSelectLayer(item.id)}
                    className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-800 transition"
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
