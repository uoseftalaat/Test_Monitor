import React from 'react';
import { FileArchive, Download, Globe, Zap, Smartphone } from 'lucide-react';
import { formatBytes, formatUploadTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

function zipMeta(zip) {
  return [zip?.fileName, formatBytes(zip?.sizeBytes), zip?.uploadedAt && formatUploadTime(zip.uploadedAt)]
    .filter(Boolean)
    .join(' · ');
}

export default function PlaywrightZipBanner({
  selectedLayer,
  layers = {}
}) {
  const currentLayerData = selectedLayer !== 'all' ? (layers[selectedLayer] || {}) : null;
  const currentLayerZip = currentLayerData?.playwrightZip || null;
  const currentLayerZipUrl = currentLayerData?.playwrightZipUrl || currentLayerZip?.url || null;

  if (selectedLayer !== 'all') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'p-2.5 rounded-lg shrink-0',
                currentLayerZipUrl ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-400'
              )}
            >
              <FileArchive className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">Playwright Report</h3>
              <p className="text-xs text-gray-500 truncate">
                {currentLayerZipUrl ? zipMeta(currentLayerZip) : 'No report available'}
              </p>
            </div>
          </div>

          {currentLayerZipUrl && (
            <a
              href={currentLayerZipUrl}
              download={currentLayerZip?.fileName || `playwright-report-${selectedLayer}.zip`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          )}
        </div>

        {currentLayerZipUrl && (
          <p className="mt-3 text-[11px] text-gray-400">
            Unzip the file and open it in your browser to view the report offline.
          </p>
        )}
      </div>
    );
  }

  // 'all' layer view: one report per pipeline, listed
  const layerRows = [
    { id: 'web', name: 'Web', icon: Globe },
    { id: 'api', name: 'API', icon: Zap },
    { id: 'mobile', name: 'Mobile', icon: Smartphone }
  ].map(l => {
    const data = layers[l.id] || {};
    const zip = data.playwrightZip;
    const url = data.playwrightZipUrl || zip?.url;
    return { ...l, zip, url, notConfigured: data.notConfigured };
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-gray-900">Playwright Reports</h3>
      <p className="text-xs text-gray-500 mt-0.5">Download the test report for each pipeline</p>

      <div className="mt-4 divide-y divide-gray-100">
        {layerRows.map(item => {
          const Icon = item.icon;
          const hasZip = Boolean(item.url);
          return (
            <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm font-medium text-gray-700 shrink-0">{item.name}</span>
                <span className="text-xs text-gray-400 truncate">
                  {hasZip ? zipMeta(item.zip) : item.notConfigured ? 'Not configured' : 'No report available'}
                </span>
              </div>

              {hasZip && (
                <a
                  href={item.url}
                  download={item.zip?.fileName || `playwright-report-${item.id}.zip`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
