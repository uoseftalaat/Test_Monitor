import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Layers
} from 'lucide-react';
import ProjectCard from './ProjectCard';
import MetricCard from '../common/MetricCard';

export default function GlobalOverview({ globalSummary, onSelectProject }) {
  if (!globalSummary) return null;

  const { overallSummary, projects = [] } = globalSummary;

  // Prioritize projects with active failures first so testers see issues immediately
  const sortedProjects = [...projects].sort((a, b) => {
    const aFailed = a.summary?.failed || 0;
    const bFailed = b.summary?.failed || 0;
    if (aFailed > 0 && bFailed === 0) return -1;
    if (bFailed > 0 && aFailed === 0) return 1;
    if (aFailed !== bFailed) return bFailed - aFailed;
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Intro */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-1 h-8 bg-primary-500 rounded shrink-0" />
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Executive QA Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Unified test execution health across all platforms and automated test suites.
          </p>
        </div>
      </div>

      {/* High-level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pass Rate Card */}
        <MetricCard
          title="Overall Pass Rate"
          value={`${overallSummary?.passRate || 0}%`}
          subtext="overall health"
          icon={TrendingUp}
          color="emerald"
          progressPercent={overallSummary?.passRate || 0}
        />

        {/* Total Tests Card */}
        <MetricCard
          title="Total Monitored Tests"
          value={overallSummary?.totalTests || 0}
          subtext={`across ${projects.length} projects`}
          icon={Layers}
          color="blue"
        />

        {/* Active Failures Card */}
        <MetricCard
          title="Active Failures"
          value={overallSummary?.totalFailed || 0}
          subtext={overallSummary?.totalFailed > 0 ? 'requiring attention' : 'all suites clean'}
          icon={XCircle}
          color={overallSummary?.totalFailed > 0 ? 'red' : 'emerald'}
        />

        {/* Flaky Tests Card */}
        <MetricCard
          title="Flaky Tests"
          value={overallSummary?.totalFlaky || 0}
          subtext="unstable runs"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Active Projects</h2>
          <span className="text-xs text-gray-500">{projects.length} integrated test suites</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedProjects.map((proj) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              onSelectProject={onSelectProject}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
