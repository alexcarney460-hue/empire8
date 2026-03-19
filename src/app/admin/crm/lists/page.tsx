'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { crmFetch } from '../components/api';

interface CrmList {
  id: number;
  name: string;
  description: string | null;
  type: string | null;
  created_at: string | null;
}

const emptyForm = { name: '', description: '', type: 'static' };

export default function ListsPage() {
  const [lists, setLists] = useState<CrmList[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CrmList | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await crmFetch('/api/admin/crm/lists');
    if (res.ok) { setLists(res.data); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: CrmList) => {
    setEditing(item);
    setForm({ name: item.name || '', description: item.description || '', type: item.type || 'static' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body: Record<string, string> = {};
    Object.entries(form).forEach(([k, v]) => { if (v.trim()) body[k] = v.trim(); });

    if (editing) {
      const res = await crmFetch(`/api/admin/crm/lists/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      if (res.ok) { closeModal(); load(); }
    } else {
      const res = await crmFetch('/api/admin/crm/lists', { method: 'POST', body: JSON.stringify(body) });
      if (res.ok) { closeModal(); load(); }
    }
    setSaving(false);
  };

  const handleDelete = async (item: CrmList) => {
    if (!confirm(`Delete list "${item.name}"? This cannot be undone.`)) return;
    const res = await crmFetch(`/api/admin/crm/lists/${item.id}`, { method: 'DELETE' });
    if (res.ok) { load(); }
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : '--';

  const inputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Lists</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors">+ Create List</button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">Loading...</td></tr>
              ) : lists.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No lists found.</td></tr>
              ) : (
                lists.map((item) => (
                  <tr key={String(item.id)} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/crm/lists/${item.id}`} className="text-white font-medium hover:text-sky-400 transition-colors">
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{item.description || '--'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-slate-800 text-slate-300 capitalize">{item.type || '--'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{fmtDate(item.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(item)} className="text-sky-400 hover:text-sky-300 text-sm mr-3 transition-colors">Edit</button>
                      <button onClick={() => handleDelete(item)} className="text-red-400 hover:text-red-300 text-sm transition-colors">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{editing ? 'Edit List' : 'Create List'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} rows={3} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
                  <option value="static">Static</option>
                  <option value="dynamic">Dynamic</option>
                  <option value="smart">Smart</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {saving ? 'Saving...' : editing ? 'Update List' : 'Create List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
