import { cn, titleize } from '../../lib/utils';

const styles = {
  active: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  available: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  completed: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  overdue: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  cancelled: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
  damaged: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  high: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  medium: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  low: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
};

export function StatusBadge({ value }) {
  return <span className={cn('status-pill', styles[value] || 'border-white/15 bg-white/10 text-white')}>{titleize(value)}</span>;
}
