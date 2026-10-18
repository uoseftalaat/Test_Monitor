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
      iconBg: 'bg-primary-50 text-primary-600',
      valueColor: 'text-gray-900',
      progress: 'bg-primary-500'
    },
    emerald: {
      iconBg: 'bg-success-50 text-success-600',
      valueColor: 'text-gray-900',
      progress: 'bg-success-500'
    },
    red: {
      iconBg: 'bg-destructive-50 text-destructive-600',
      valueColor: 'text-destructive-600',
      progress: 'bg-destructive-500'
    },
    amber: {
      iconBg: 'bg-warning-50 text-warning-600',
      valueColor: 'text-warning-600',
      progress: 'bg-warning-500'
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600',
      valueColor: 'text-purple-600',
      progress: 'bg-purple-500'
    }
  }[color] || {
    iconBg: 'bg-primary-50 text-primary-600',
    valueColor: 'text-gray-900',
    progress: 'bg-primary-500'
  };

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-5 transition-shadow duration-200 hover:shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</span>
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
        {subtext && <span className="text-xs text-gray-500">{subtext}</span>}
      </div>

      {progressPercent !== null && (
        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', colorStyles.progress)}
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
}
