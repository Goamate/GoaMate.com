import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = status.toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['approved', 'confirmed', 'completed', 'active'].includes(s)) {
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (['pending', 'pending_approval'].includes(s)) {
    styles = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (['rejected', 'suspended', 'cancelled', 'revoked'].includes(s)) {
    styles = 'bg-rose-50 text-rose-800 border-rose-200';
  } else if (['draft'].includes(s)) {
    styles = 'bg-slate-100 text-slate-600 border-slate-300';
  }

  const label = s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap ${padding} ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {label}
    </span>
  );
};
