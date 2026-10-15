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
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
    dotClass: 'bg-red-500',
    borderClass: 'border-red-500/30',
    bgClass: 'bg-red-950/40'
  },
  flaky: {
    id: 'flaky',
    label: 'Flaky',
    icon: AlertTriangle,
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-500',
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-950/40'
  },
  passed: {
    id: 'passed',
    label: 'Passed',
    icon: CheckCircle2,
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-500',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-950/40'
  },
  skipped: {
    id: 'skipped',
    label: 'Skipped',
    icon: Clock,
    color: 'slate',
    badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
    dotClass: 'bg-slate-500',
    borderClass: 'border-slate-800',
    bgClass: 'bg-slate-900/40'
  }
};

export function getStatusConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.skipped;
}
