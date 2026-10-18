import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';

export const STATUS_PRIORITY = {
  failed: 0,
  flaky: 1,
  passed: 2,
  skipped: 3
};

export const STATUS_CONFIG = {
  failed: {
    id: 'failed',
    label: 'Failed',
    icon: XCircle,
    color: 'red',
    badgeClass: 'bg-destructive-50 text-destructive-600 border-destructive-200',
    dotClass: 'bg-destructive-500',
    borderClass: 'border-destructive-200',
    bgClass: 'bg-destructive-50'
  },
  flaky: {
    id: 'flaky',
    label: 'Flaky',
    icon: AlertTriangle,
    color: 'amber',
    badgeClass: 'bg-warning-50 text-warning-600 border-warning-200',
    dotClass: 'bg-warning-500',
    borderClass: 'border-warning-200',
    bgClass: 'bg-warning-50'
  },
  passed: {
    id: 'passed',
    label: 'Passed',
    icon: CheckCircle2,
    color: 'emerald',
    badgeClass: 'bg-success-50 text-success-600 border-success-200',
    dotClass: 'bg-success-500',
    borderClass: 'border-success-200',
    bgClass: 'bg-success-50'
  },
  skipped: {
    id: 'skipped',
    label: 'Skipped',
    icon: Clock,
    color: 'gray',
    badgeClass: 'bg-gray-100 text-gray-500 border-gray-200',
    dotClass: 'bg-gray-400',
    borderClass: 'border-gray-200',
    bgClass: 'bg-gray-100'
  }
};

export function getStatusConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.skipped;
}
