import React from 'react';
import { getStatusConfig } from '../../constants/status';
import { cn } from '../../utils/cn';

export default function StatusBadge({ status, showIcon = true, size = 'sm', className = '' }) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2'
  }[size] || 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold uppercase tracking-wide border',
        config.badgeClass,
        sizeClasses,
        className
      )}
    >
      {showIcon && <Icon className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
}
