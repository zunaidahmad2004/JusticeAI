import clsx from 'clsx';

interface Props {
  status: string;
  type?: 'case' | 'priority' | 'generic';
}

const caseStatusMap: Record<string, string> = {
  open: 'badge-open',
  under_investigation: 'badge-active',
  chargesheet_filed: 'badge-filed',
  closed: 'badge-closed',
  archived: 'badge-archived',
};

const priorityMap: Record<string, string> = {
  low: 'badge-low',
  medium: 'badge-medium',
  high: 'badge-high',
  critical: 'badge bg-red-700/50 text-red-200 border border-red-600',
};

const caseStatusLabel: Record<string, string> = {
  open: 'Open',
  under_investigation: 'Under Investigation',
  chargesheet_filed: 'Chargesheet Filed',
  closed: 'Closed',
  archived: 'Archived',
};

export default function StatusBadge({ status, type = 'case' }: Props) {
  let className = '';
  let label = status;

  if (type === 'case') {
    className = caseStatusMap[status] || 'badge bg-slate-800 text-slate-400';
    label = caseStatusLabel[status] || status;
  } else if (type === 'priority') {
    className = priorityMap[status] || 'badge bg-slate-800 text-slate-400';
    label = status.charAt(0).toUpperCase() + status.slice(1);
  } else {
    className = 'badge bg-slate-800 text-slate-400 border border-slate-700';
  }

  return <span className={className}>{label}</span>;
}
