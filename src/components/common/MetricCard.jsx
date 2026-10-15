import React from 'react';
import { cn } from '../../utils/cn';

export default function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'blue',
  progressPercent = null,
  className = ''
}) {
  const colorStyles = {
    blue: {
      iconBg: 'bg-blue-500/10 text-blue-400',
      valueColor: 'text-white',
      progress: 'bg-blue-500'
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      valueColor: 'text-white',
      progress: 'bg-emerald-500'
    },
    red: {
      iconBg: 'bg-red-500/10 text-red-400',
      valueColor: 'text-red-400',
      progress: 'bg-red-500'
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400',
      valueColor: 'text-amber-400',
      progress: 'bg-amber-500'
    },
    purple: {
      iconBg: 'bg-purple-500/10 text-purple-400',
      valueColor: 'text-purple-400',
      progress: 'bg-purple-500'
    }
  }[color] || {
    iconBg: 'bg-blue-500/10 text-blue-400',
    valueColor: 'text-white',
    progress: 'bg-blue-500'
  };

  return (
    <div className={cn('bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', colorStyles.iconBg)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={cn('text-3xl font-extrabold tracking-tight', colorStyles.valueColor)}>
          {value}
        </span>
        {subtext && <span className="text-xs text-slate-400">{subtext}</span>}
      </div>

      {progressPercent !== null && (
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', colorStyles.progress)}
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
}
