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
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">{projectName}</h1>
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20"
            >
              <span>Repository</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Layer Health</span>
          <span className="text-2xl font-extrabold text-white">{passRate}%</span>
        </div>
        <div className="w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center font-bold text-xs bg-slate-950">
          <span className={cn(passRate >= 95 ? 'text-emerald-400' : 'text-amber-400')}>
            {passRate}%
          </span>
        </div>
      </div>
    </div>
  );
}
