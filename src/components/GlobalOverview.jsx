import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight, 
  ExternalLink,
  Layers,
  Smartphone,
  Globe,
  Zap
} from 'lucide-react';

export default function GlobalOverview({ globalSummary, onSelectProject }) {
  if (!globalSummary) return null;

  const { overallSummary, projects = [] } = globalSummary;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Intro */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Executive QA Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">
          Unified test execution health across all platforms and automated test suites.
        </p>
      </div>

      {/* High-level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pass Rate Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overall Pass Rate</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{overallSummary?.passRate || 0}%</span>
            <span className="text-xs text-emerald-400 font-medium">30-day health</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${overallSummary?.passRate || 0}%` }}
            />
          </div>
        </div>

        {/* Total Tests Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Monitored Tests</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{overallSummary?.totalTests || 0}</span>
            <span className="text-xs text-slate-400">across {projects.length} projects</span>
          </div>
          <div className="text-xs text-slate-400 mt-3 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>{overallSummary?.totalPassed || 0} passed consistently</span>
          </div>
        </div>

        {/* Active Failures Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Failures</span>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-400">{overallSummary?.totalFailed || 0}</span>
            <span className="text-xs text-red-400/80 font-medium">requiring attention</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {overallSummary?.totalFailed > 0 ? 'Click into project to review stack traces' : 'All suites passing cleanly'}
          </p>
        </div>

        {/* Flaky Tests Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Flaky Tests</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{overallSummary?.totalFlaky || 0}</span>
            <span className="text-xs text-amber-400/80 font-medium">unstable runs</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">Intermittent pass/fail across last 30d</p>
        </div>
      </div>

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white tracking-tight">Active Projects</h2>
          <span className="text-xs text-slate-400">{projects.length} integrated test suites</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((proj) => {
            const hasFailures = proj.summary?.failed > 0;
            const passRate = proj.summary?.passRate || 0;

            let statusBadge = (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
              </span>
            );

            if (hasFailures) {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  <XCircle className="h-3.5 w-3.5" /> {proj.summary.failed} Failed
                </span>
              );
            } else if (proj.summary?.flaky > 0) {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="h-3.5 w-3.5" /> Flaky
                </span>
              );
            }

            return (
              <div 
                key={proj.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-6 transition duration-200 flex flex-col justify-between group shadow-sm hover:shadow-md hover:shadow-blue-500/5"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
                          {proj.name}
                        </h3>
                        {proj.repoUrl && (
                          <a 
                            href={proj.repoUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-slate-400 hover:text-slate-300"
                            title="Open repository"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{proj.description}</p>
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
                        className={`h-full rounded-full transition-all duration-500 ${
                          passRate >= 95 ? 'bg-emerald-500' : passRate >= 85 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
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
                        <span className="text-xs font-bold text-slate-200">{proj.layers?.web ?? '-'}%</span>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-2 text-center border border-slate-800">
                        <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-0.5">
                          <Zap className="h-3 w-3 text-amber-400" /> API
                        </div>
                        <span className="text-xs font-bold text-slate-200">{proj.layers?.api ?? '-'}%</span>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-2 text-center border border-slate-800">
                        <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-0.5">
                          <Smartphone className="h-3 w-3 text-emerald-400" /> Mobile
                        </div>
                        <span className="text-xs font-bold text-slate-200">{proj.layers?.mobile ?? '-'}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {proj.summary?.total || 0} total test cases
                  </span>
                  <button
                    onClick={() => onSelectProject(proj.id)}
                    className="flex items-center gap-1 text-blue-400 font-semibold group-hover:text-blue-300 transition"
                  >
                    <span>View Test Cases</span>
                    <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
