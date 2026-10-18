import React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function ProjectHeader({
  projectName,
  description,
  repoUrl,
  passRate = 100
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="w-1 h-8 bg-primary-500 rounded shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">{projectName}</h1>
            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-200"
              >
                <span>Repository</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
      </div>

      <div className="text-right">
        <span className="text-xs text-gray-500 block">Layer Health</span>
        <span className={cn('text-2xl font-extrabold', passRate >= 95 ? 'text-success-600' : 'text-warning-600')}>
          {passRate}%
        </span>
      </div>
    </div>
  );
}
