'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { crmFetch } from '../../components/api';

interface Contact { id: number; firstname: string | null; lastname: string | null; email: string | null; lead_status: string | null; }
interface Deal { id: number; name: string | null; stage: string | null; amount: number | null; created_at: string; }
interface Activity { id: number; type: string; subject: string | null; body: string | null; created_at: string; }

interface CompanyDetail {
  id: number; name: string; domain: string | null; phone: string | null;
  city: string | null; state: string | null; industry: string | null;
  source: string | null; rating: number | null; review_count: number | null;
  notes: string | null; contacts: Contact[]; deals: Deal[]; activities: Activity[];
}

const IC = 'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', domain: '', phone: '', city: '', state: '', industry: '', source: '', notes: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await crmFetch(`/api/admin/crm/companies/${id}`);
    if (res.ok) {
      const d = res.data;
      setCompany(d);
      setForm({ name: d.name || '', domain: d.domain || '', phone: d.phone || '', city: d.city || '', state: d.state || '', industry: d.industry || '', source: d.source || '', notes: d.notes || '' });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    const res = await crmFetch(`/api/admin/crm/companies/${id}`, { method: 'PATCH', body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { setEditing(false); load(); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this company? This cannot be undone.')) return;
    const res = await crmFetch(`/api/admin/crm/companies/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/crm/companies');
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-slate-400 text-sm">Loading...</div></div>;

  if (!company) return (
    <div>
      <button onClick={() => router.push('/admin/crm/companies')} className="text-sky-400 text-sm mb-4 hover:underline">&larr; Back</button>
      <div className="text-slate-400">Company not found (ID: {id})</div>
    </div>
  );

  return (
    <div>
      <button onClick={() => router.push('/admin/crm/companies')} className="text-sky-400 text-sm mb-6 hover:underline">&larr; Back to Companies</button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{company.name}</h1>
          {company.domain && <p className="text-slate-400 text-sm mt-1">{company.domain}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(!editing)} className="px-4 py-2 rounded-lg text-sm font-medium bg-sky-600 text-white hover:bg-sky-500">{editing ? 'Cancel' : 'Edit'}</button>
          <button onClick={handleDelete} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600/20 text-red-400 border border-red-500/20 hover:bg-red-600/30">Delete</button>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Company Information</h2>
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['name', 'domain', 'phone', 'city', 'state', 'industry', 'source'] as const).map((f) => (
              <div key={f}>
                <label className="block text-xs text-slate-500 mb-1 capitalize">{f}</label>
                <input className={IC} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Notes</label>
              <textarea className={IC} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-medium bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[['Phone', company.phone], ['City', company.city], ['State', company.state], ['Industry', company.industry], ['Source', company.source], ['Rating', company.rating != null ? `${company.rating} (${company.review_count ?? 0} reviews)` : null]].map(([label, val]) => (
              <div key={label as string}>
                <div className="text-xs text-slate-500">{label as string}</div>
                <div className="text-sm text-white mt-0.5">{(val as string) || '—'}</div>
              </div>
            ))}
            {company.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <div className="text-xs text-slate-500">Notes</div>
                <div className="text-sm text-slate-300 mt-0.5 whitespace-pre-wrap">{company.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contacts */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Contacts ({company.contacts.length})</h2>
        {company.contacts.length === 0 ? <p className="text-slate-500 text-sm">No contacts linked.</p> : (
          <div className="space-y-2">
            {company.contacts.map((c) => (
              <button key={String(c.id)} onClick={() => router.push(`/admin/crm/contacts/${c.id}`)} className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-left">
                <div>
                  <div className="text-sm text-white font-medium">{[c.firstname, c.lastname].filter(Boolean).join(' ') || '—'}</div>
                  <div className="text-xs text-slate-400">{c.email || '—'}</div>
                </div>
                {c.lead_status && <span className="text-xs px-2 py-0.5 rounded-full bg-sky-600/20 text-sky-400">{c.lead_status}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Deals */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Deals ({company.deals.length})</h2>
        {company.deals.length === 0 ? <p className="text-slate-500 text-sm">No deals.</p> : (
          <div className="space-y-2">
            {company.deals.map((d) => (
              <div key={String(d.id)} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <div>
                  <div className="text-sm text-white font-medium">{d.name || 'Untitled'}</div>
                  <div className="text-xs text-slate-400">{d.stage ?? '—'}</div>
                </div>
                {d.amount != null && <span className="text-sm font-semibold text-emerald-400">${d.amount.toLocaleString()}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activities */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Activities ({company.activities.length})</h2>
        {company.activities.length === 0 ? <p className="text-slate-500 text-sm">No activities.</p> : (
          <div className="space-y-2">
            {company.activities.map((a) => (
              <div key={String(a.id)} className="p-3 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{a.type}</span>
                  <span className="text-xs text-slate-500">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                {a.subject && <div className="text-sm text-white">{a.subject}</div>}
                {a.body && <div className="text-xs text-slate-400 mt-1">{a.body}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
