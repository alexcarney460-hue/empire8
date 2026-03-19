'use client';

interface StatCardProps {
  label: string;
  value: number | string;
  href?: string;
}

export default function StatCard({ label, value, href }: StatCardProps) {
  const inner = (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
      <p className="text-sm font-medium text-slate-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {inner}
      </a>
    );
  }

  return inner;
}
