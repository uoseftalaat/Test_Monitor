import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, ArrowRight, Globe, Zap, Smartphone } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function ProjectCard({ project, onSelectProject }) {
  const hasFailures = project.summary?.failed > 0;
  const passRate = project.summary?.passRate ?? 0;

  let statusBadge = (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
    </span>
  );

  if (hasFailures) {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        <XCircle className="h-3.5 w-3.5" /> {project.summary.failed} Failed
      </span>
    );
  } else if (project.summary?.flaky > 0) {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertTriangle className="h-3.5 w-3.5" /> Flaky
      </span>
    );
  }

  return (
    <div
      onClick={() => onSelectProject(project.id)}
      className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/95 rounded-xl p-6 transition duration-200 flex flex-col justify-between group shadow-sm hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
                {project.name}
              </h3>
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition"
                  title="Open repository on GitHub"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">{project.description}</p>
          </div>
          <div>{statusBadge}</div>
        </div>

        {/* Progress & Pass Rate */}
        <div className="mt-5">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-400">Pass Rate</span>
            <span className="font-semibold text-slate-200">{passRate}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                passRate >= 95 ? 'bg-emerald-500' : passRate >= 85 ? 'bg-amber-500' : 'bg-red-500'
              )}
              style={{ width: `${passRate}%` }}
            />
          </div>
        </div>

        {/* Layer Breakdown Mini Badges */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">
            Layer Health
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/50 rounded-lg p-2 text-center border border-slate-800">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-0.5">
                <Globe className="h-3 w-3 text-blue-400" /> Web
              </div>
              <span className="text-xs font-bold text-slate-200">{project.layers?.web ?? '-'}%</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 text-center border border-slate-800">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-0.5">
                <Zap className="h-3 w-3 text-amber-400" /> API
              </div>
              <span className="text-xs font-bold text-slate-200">{project.layers?.api ?? '-'}%</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 text-center border border-slate-800">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-0.5">
                <Smartphone className="h-3 w-3 text-emerald-400" /> Mobile
              </div>
              <span className="text-xs font-bold text-slate-200">{project.layers?.mobile ?? '-'}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400">
          {project.summary?.total || 0} total test cases
        </span>
        <button
          onClick={() => onSelectProject(project.id)}
          className="flex items-center gap-1 text-blue-400 font-semibold group-hover:text-blue-300 transition"
        >
          <span>View Test Cases</span>
          <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition" />
        </button>
      </div>
    </div>
  );
}
