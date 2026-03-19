'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { crmFetch } from '@/app/admin/crm/components/api';
import SearchBar from '@/app/admin/crm/components/SearchBar';
import Pagination from '@/app/admin/crm/components/Pagination';
import StatusBadge from '@/app/admin/crm/components/StatusBadge';
import StageBadge from '@/app/admin/crm/components/StageBadge';
import Modal from '@/app/admin/crm/components/Modal';

interface Contact {
  id: number;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  phone: string | null;
  lead_status: string | null;
  lifecycle_stage: string | null;
  source: string | null;
  last_contacted_at: string | null;
  created_at: string;
  companies?: { id: number; name: string; domain: string | null } | null;
}

const LEAD_STATUSES = ['new', 'open', 'in_progress', 'open_deal', 'unqualified', 'attempted_to_contact', 'connected', 'bad_timing'];
const LIFECYCLE_STAGES = ['subscriber', 'lead', 'marketing_qualified_lead', 'sales_qualified_lead', 'opportunity', 'customer', 'evangelist'];
const SOURCES = ['website', 'referral', 'social', 'email', 'paid', 'organic', 'direct', 'other'];

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ firstname: '', lastname: '', email: '', phone: '', lead_status: 'new', lifecycle_stage: 'lead', source: '' });
  const [saving, setSaving] = useState(false);
  const limit = 25;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('q', search);
    if (statusFilter) params.set('lead_status', statusFilter);
    if (stageFilter) params.set('lifecycle_stage', stageFilter);
    if (sourceFilter) params.set('source', sourceFilter);
    const res = await crmFetch(`/api/admin/crm/contacts?${params}`);
    if (res.ok) { setContacts(res.data); setTotal(res.total); }
    setLoading(false);
  }, [page, search, statusFilter, stageFilter, sourceFilter]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);
  useEffect(() => { setPage(1); }, [search, statusFilter, stageFilter, sourceFilter]);

  async function handleAdd() {
    setSaving(true);
    const res = await crmFetch('/api/admin/crm/contacts', { method: 'POST', body: JSON.stringify(addForm) });
    setSaving(false);
    if (res.ok) {
      setShowAdd(false);
      setAddForm({ firstname: '', lastname: '', email: '', phone: '', lead_status: 'new', lifecycle_stage: 'lead', source: '' });
      fetchContacts();
    }
  }

  async function handleBulkStatus(status: string) {
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => crmFetch(`/api/admin/crm/contacts/${id}`, { method: 'PATCH', body: JSON.stringify({ lead_status: status }) })));
    setSelected(new Set());
    fetchContacts();
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} contact(s)?`)) return;
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => crmFetch(`/api/admin/crm/contacts/${id}`, { method: 'DELETE' })));
    setSelected(new Set());
    fetchContacts();
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === contacts.length) setSelected(new Set());
    else setSelected(new Set(contacts.map((c) => c.id)));
  }

  const inputCls = 'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500';
  const selectCls = 'px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-sm text-slate-400 mt-1">{total} total contact{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search contacts..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
          <option value="">All Statuses</option>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className={selectCls}>
          <option value="">All Stages</option>
          {LIFECYCLE_STAGES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={selectCls}>
          <option value="">All Sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
          <span className="text-sm text-slate-300">{selected.size} selected</span>
          <select
            defaultValue=""
            onChange={(e) => { if (e.target.value) handleBulkStatus(e.target.value); e.target.value = ''; }}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none"
          >
            <option value="" disabled>Change Status</option>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1.5 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors"
          >
            Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sm text-slate-500 hover:text-white ml-auto">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={contacts.length > 0 && selected.size === contacts.length}
                    onChange={toggleAll}
                    className="rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-0"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden xl:table-cell">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden xl:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">Loading...</td></tr>
              ) : contacts.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">No contacts found</td></tr>
              ) : (
                contacts.map((contact) => (
                  <tr
                    key={String(contact.id)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/crm/contacts/${contact.id}`)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
                        className="rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-0"
                      />
                    </td>
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                      {[contact.firstname, contact.lastname].filter(Boolean).join(' ') || '--'}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{contact.email || '--'}</td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{contact.phone || '-'}</td>
                    <td className="px-4 py-3 text-slate-300 hidden md:table-cell">{contact.companies?.name || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={contact.lead_status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><StageBadge stage={contact.lifecycle_stage || 'unknown'} /></td>
                    <td className="px-4 py-3 text-slate-400 hidden xl:table-cell capitalize">{contact.source || '-'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden xl:table-cell whitespace-nowrap">
                      {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>

      {/* Add Contact Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Contact">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">First Name</label>
              <input type="text" value={addForm.firstname} onChange={(e) => setAddForm({ ...addForm, firstname: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Last Name</label>
              <input type="text" value={addForm.lastname} onChange={(e) => setAddForm({ ...addForm, lastname: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
            <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
            <input type="tel" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Lead Status</label>
              <select value={addForm.lead_status} onChange={(e) => setAddForm({ ...addForm, lead_status: e.target.value })} className={inputCls}>
                {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Lifecycle Stage</label>
              <select value={addForm.lifecycle_stage} onChange={(e) => setAddForm({ ...addForm, lifecycle_stage: e.target.value })} className={inputCls}>
                {LIFECYCLE_STAGES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Source</label>
            <select value={addForm.source} onChange={(e) => setAddForm({ ...addForm, source: e.target.value })} className={inputCls}>
              <option value="">Select source</option>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button
              onClick={handleAdd}
              disabled={saving || !addForm.email}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Add Contact'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
