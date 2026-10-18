import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, ArrowRight, Globe, Zap, Smartphone } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function ProjectCard({ project, onSelectProject }) {
  const hasFailures = project.summary?.failed > 0;
  const passRate = project.summary?.passRate ?? 0;

  let statusBadge = (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success-50 text-success-700 border border-success-200">
      <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
    </span>
  );

  if (hasFailures) {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive-50 text-destructive-600 border border-destructive-200">
        <XCircle className="h-3.5 w-3.5" /> {project.summary.failed} Failed
      </span>
    );
  } else if (project.summary?.flaky > 0) {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-warning-50 text-warning-600 border border-warning-200">
        <AlertTriangle className="h-3.5 w-3.5" /> Flaky
      </span>
    );
  }

  return (
    <div
      onClick={() => onSelectProject(project.id)}
      className="bg-white border border-gray-200 hover:border-primary-300 rounded-lg p-6 transition duration-200 flex flex-col justify-between group shadow-sm hover:shadow-md cursor-pointer"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition">
                {project.name}
              </h3>
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
                  title="Open repository on GitHub"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{project.description}</p>
          </div>
          <div>{statusBadge}</div>
        </div>

        {/* Progress & Pass Rate */}
        <div className="mt-5">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-gray-500">Pass Rate</span>
            <span className="font-semibold text-gray-700">{passRate}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                passRate >= 95 ? 'bg-success-500' : passRate >= 85 ? 'bg-warning-500' : 'bg-destructive-500'
              )}
              style={{ width: `${passRate}%` }}
            />
          </div>
        </div>

        {/* Layer Breakdown Mini Badges */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 block mb-2">
            Layer Health
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
              <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500 mb-0.5">
                <Globe className="h-3 w-3 text-primary-500" /> Web
              </div>
              <span className="text-xs font-bold text-gray-700">{project.layers?.web ?? '-'}%</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
              <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500 mb-0.5">
                <Zap className="h-3 w-3 text-warning-500" /> API
              </div>
              <span className="text-xs font-bold text-gray-700">{project.layers?.api ?? '-'}%</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
              <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500 mb-0.5">
                <Smartphone className="h-3 w-3 text-success-500" /> Mobile
              </div>
              <span className="text-xs font-bold text-gray-700">{project.layers?.mobile ?? '-'}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {project.summary?.total || 0} total test cases
        </span>
        <button
          onClick={() => onSelectProject(project.id)}
          className="flex items-center gap-1 text-primary-600 font-semibold group-hover:text-primary-700 transition"
        >
          <span>View Test Cases</span>
          <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition" />
        </button>
      </div>
    </div>
  );
}
