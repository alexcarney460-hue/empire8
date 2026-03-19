'use client';

const statusColors: Record<string, { bg: string; text: string }> = {
  // Contact lead statuses (from LEAD_STATUSES in contacts page)
  new:                    { bg: 'bg-sky-500/20',      text: 'text-sky-400' },
  open:                   { bg: 'bg-blue-500/20',     text: 'text-blue-400' },
  in_progress:            { bg: 'bg-indigo-500/20',   text: 'text-indigo-400' },
  open_deal:              { bg: 'bg-violet-500/20',   text: 'text-violet-400' },
  attempted_to_contact:   { bg: 'bg-amber-500/20',    text: 'text-amber-400' },
  connected:              { bg: 'bg-teal-500/20',     text: 'text-teal-400' },
  bad_timing:             { bg: 'bg-orange-500/20',   text: 'text-orange-400' },
  unqualified:            { bg: 'bg-slate-500/20',    text: 'text-slate-400' },
  // Deal / legacy statuses
  contacted:              { bg: 'bg-blue-500/20',     text: 'text-blue-400' },
  qualified:              { bg: 'bg-purple-500/20',   text: 'text-purple-400' },
  proposal:               { bg: 'bg-amber-500/20',    text: 'text-amber-400' },
  negotiation:            { bg: 'bg-orange-500/20',   text: 'text-orange-400' },
  won:                    { bg: 'bg-emerald-500/20',  text: 'text-emerald-400' },
  lost:                   { bg: 'bg-red-500/20',      text: 'text-red-400' },
  // Square webhook sets this uppercase value
  CUSTOMER:               { bg: 'bg-emerald-500/20',  text: 'text-emerald-400' },
};

export default function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-slate-500">--</span>;
  const color = statusColors[status] || { bg: 'bg-slate-500/20', text: 'text-slate-400' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${color.bg} ${color.text}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
