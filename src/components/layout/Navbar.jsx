import React from 'react';
import { RefreshCw, Activity, Layers, LogOut, User, Radio } from 'lucide-react';
import { formatTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export default function Navbar({
  projects,
  selectedProject,
  onSelectProject,
  onRefresh,
  isRefreshing,
  lastUpdated,
  autoRefreshInterval,
  onChangeAutoRefresh,
  user,
  onSignOut,
  onSignInClick,
  isFirebaseLive
}) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with branding and actions */}
        <div className="flex items-center justify-between h-16 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-gray-900 tracking-tight">TestMonitor</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                  QA Intelligence
                </span>
                {isFirebaseLive ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success-50 text-success-700 border border-success-200">
                    <Radio className="h-3 w-3 animate-pulse text-success-500" />
                    Firebase Live
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                    Local Data
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">Automated Pipeline &amp; Regression Monitoring</p>
            </div>
          </div>

          {/* Right controls: Last updated, Auto-refresh, Manual refresh & User profile */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <span className={cn('flex h-2 w-2 rounded-full', isFirebaseLive ? 'bg-success-500 animate-pulse' : 'bg-gray-400')} />
              <span>Updated: <span className="text-gray-700 font-mono">{formatTime(lastUpdated)}</span></span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={autoRefreshInterval}
                onChange={(e) => onChangeAutoRefresh(Number(e.target.value))}
                className="text-xs bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none transition focus:border-primary-500"
                title="Auto-refresh frequency"
              >
                <option value={0}>Auto: Off</option>
                <option value={30}>Auto: 30s</option>
                <option value={60}>Auto: 60s</option>
                <option value={300}>Auto: 5m</option>
              </select>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95"
                title="Fetch latest test data"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>

            {/* Auth control */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-gray-400 truncate max-w-[120px]">{user.email}</span>
                </div>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <button
                  onClick={onSignOut}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-destructive-600 hover:bg-destructive-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : onSignInClick ? (
              <button
                onClick={onSignInClick}
                className="text-xs font-medium bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-300 transition"
              >
                Sign In
              </button>
            ) : null}
          </div>
        </div>

        {/* Scalable Project Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none">
          <button
            onClick={() => onSelectProject('all')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap',
              selectedProject === 'all'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Projects</span>
          </button>

          {projects.map((proj) => {
            const hasFailures = proj.summary?.failed > 0;
            const isSelected = selectedProject === proj.id;

            return (
              <button
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap relative',
                  isSelected
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                )}
              >
                <span>{proj.name}</span>
                {hasFailures ? (
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.2 rounded-full',
                      isSelected ? 'bg-white/20 text-white' : 'bg-destructive-50 text-destructive-600 border border-destructive-200'
                    )}
                  >
                    {proj.summary.failed}
                  </span>
                ) : (
                  <span
                    className={cn(
                      'text-[10px] font-medium px-1.5 py-0.2 rounded-full',
                      isSelected ? 'bg-white/20 text-white' : 'bg-success-50 text-success-700'
                    )}
                  >
                    {proj.summary?.passRate}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
