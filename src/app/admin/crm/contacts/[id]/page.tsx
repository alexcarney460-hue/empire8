'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { crmFetch } from '../../components/api';

interface Activity { id: number; type: string; subject: string | null; body: string | null; created_at: string; }
interface Communication { id: number; channel: string; direction: string; subject: string | null; body: string | null; created_at: string; }
interface Order { id: number; email: string | null; status: string | null; total: number | null; created_at: string; }

interface ContactDetail {
  id: number; firstname: string | null; lastname: string | null; email: string | null;
  phone: string | null; lead_status: string | null; lifecycle_stage: string | null;
  source: string | null; owner: string | null; city: string | null; state: string | null;
  notes: string | null; last_contacted_at: string | null; created_at: string;
  company: { id: number; name: string; domain: string | null } | null;
  activities: Activity[]; communications: Communication[]; orders: Order[];
}

const IC = 'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'info' | 'activities' | 'communications' | 'orders'>('info');
  const [form, setForm] = useState({
    firstname: '', lastname: '', email: '', phone: '', city: '', state: '',
    source: '', lead_status: '', lifecycle_stage: '', owner: '', notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await crmFetch(`/api/admin/crm/contacts/${id}`);
    if (res.ok) {
      const d = res.data;
      setContact(d);
      setForm({
        firstname: d.firstname || '', lastname: d.lastname || '', email: d.email || '',
        phone: d.phone || '', city: d.city || '', state: d.state || '',
        source: d.source || '', lead_status: d.lead_status || '',
        lifecycle_stage: d.lifecycle_stage || '', owner: d.owner || '', notes: d.notes || '',
      });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    const res = await crmFetch(`/api/admin/crm/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { setEditing(false); load(); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this contact? This cannot be undone.')) return;
    const res = await crmFetch(`/api/admin/crm/contacts/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/crm/contacts');
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-slate-400 text-sm">Loading...</div></div>;

  if (!contact) return (
    <div>
      <button onClick={() => router.push('/admin/crm/contacts')} className="text-sky-400 text-sm mb-4 hover:underline">&larr; Back</button>
      <div className="text-slate-400">Contact not found (ID: {id})</div>
    </div>
  );

  const name = [contact.firstname, contact.lastname].filter(Boolean).join(' ') || 'Unnamed';
  const tabs = [
    { key: 'info' as const, label: 'Info' },
    { key: 'activities' as const, label: `Activities (${contact.activities.length})` },
    { key: 'communications' as const, label: `Communications (${contact.communications.length})` },
    { key: 'orders' as const, label: `Orders (${contact.orders.length})` },
  ];

  return (
    <div>
      <button onClick={() => router.push('/admin/crm/contacts')} className="text-sky-400 text-sm mb-6 hover:underline">&larr; Back to Contacts</button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{name}</h1>
          <p className="text-slate-400 text-sm mt-1">{contact.email || '—'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(!editing)} className="px-4 py-2 rounded-lg text-sm font-medium bg-sky-600 text-white hover:bg-sky-500">{editing ? 'Cancel' : 'Edit'}</button>
          <button onClick={handleDelete} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600/20 text-red-400 border border-red-500/20 hover:bg-red-600/30">Delete</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-sky-600/20 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === 'info' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Contact Information</h2>
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['firstname', 'lastname', 'email', 'phone', 'city', 'state', 'source', 'lead_status', 'lifecycle_stage', 'owner'] as const).map((f) => (
                <div key={f}>
                  <label className="block text-xs text-slate-500 mb-1 capitalize">{f.replace('_', ' ')}</label>
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
              {[
                ['Phone', contact.phone], ['City', contact.city], ['State', contact.state],
                ['Source', contact.source], ['Lead Status', contact.lead_status],
                ['Lifecycle', contact.lifecycle_stage], ['Owner', contact.owner],
                ['Company', contact.company?.name],
                ['Last Contacted', contact.last_contacted_at ? new Date(contact.last_contacted_at).toLocaleDateString() : null],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <div className="text-xs text-slate-500">{label as string}</div>
                  <div className="text-sm text-white mt-0.5">{(val as string) || '—'}</div>
                </div>
              ))}
              {contact.notes && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <div className="text-xs text-slate-500">Notes</div>
                  <div className="text-sm text-slate-300 mt-0.5 whitespace-pre-wrap">{contact.notes}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activities Tab */}
      {tab === 'activities' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Activities</h2>
          {contact.activities.length === 0 ? <p className="text-slate-500 text-sm">No activities.</p> : (
            <div className="space-y-2">
              {contact.activities.map((a) => (
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
      )}

      {/* Communications Tab */}
      {tab === 'communications' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Communications</h2>
          {contact.communications.length === 0 ? <p className="text-slate-500 text-sm">No communications.</p> : (
            <div className="space-y-2">
              {contact.communications.map((c) => (
                <div key={String(c.id)} className="p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-600/20 text-sky-400">{c.channel}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.direction === 'inbound' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-amber-600/20 text-amber-400'}`}>{c.direction}</span>
                    <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  {c.subject && <div className="text-sm text-white">{c.subject}</div>}
                  {c.body && <div className="text-xs text-slate-400 mt-1">{c.body}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Orders</h2>
          {contact.orders.length === 0 ? <p className="text-slate-500 text-sm">No orders.</p> : (
            <div className="space-y-2">
              {contact.orders.map((o) => (
                <div key={String(o.id)} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <div className="text-sm text-white font-medium">Order #{String(o.id).slice(-8)}</div>
                    <div className="text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {o.status && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{o.status}</span>}
                    {o.total != null && <span className="text-sm font-semibold text-emerald-400">${o.total.toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
