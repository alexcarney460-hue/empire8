'use client';

import { useEffect, useState } from 'react';
import { crmFetch } from '@/app/admin/crm/components/api';
import StatCard from '@/app/admin/crm/components/StatCard';

interface Stats {
  contacts: number;
  companies: number;
  deals: number;
  new_this_week: number;
}

export default function CrmDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    crmFetch('/api/admin/crm/stats')
      .then((r) => {
        if (r.ok) setStats(r.data);
        else setError(r.error || 'Failed to load stats');
      })
      .catch(() => setError('Network error'));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">CRM Dashboard</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Contacts" value={stats?.contacts ?? '--'} href="/admin/crm/contacts" />
        <StatCard label="Total Companies" value={stats?.companies ?? '--'} href="/admin/crm/companies" />
        <StatCard label="Open Deals" value={stats?.deals ?? '--'} href="/admin/crm/deals" />
        <StatCard label="New This Week" value={stats?.new_this_week ?? '--'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Contacts', href: '/admin/crm/contacts', desc: 'Manage leads and customers' },
          { label: 'Companies', href: '/admin/crm/companies', desc: 'Business accounts' },
          { label: 'Deals', href: '/admin/crm/deals', desc: 'Sales pipeline' },
          { label: 'Lists', href: '/admin/crm/lists', desc: 'Segmented lists' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="block bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-sky-500/40 hover:bg-slate-900/80 transition-colors"
          >
            <p className="text-sm font-semibold text-white mb-1">{link.label}</p>
            <p className="text-xs text-slate-400">{link.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
