'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { crmFetch } from '@/app/admin/crm/components/api';
import SearchBar from '@/app/admin/crm/components/SearchBar';
import Pagination from '@/app/admin/crm/components/Pagination';
import Modal from '@/app/admin/crm/components/Modal';

interface Company {
  id: number;
  name: string;
  domain: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  industry: string | null;
  source: string | null;
  rating: string | null;
  contacts_count: number;
  created_at: string | null;
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', domain: '', phone: '', city: '', state: '', industry: '', source: '', rating: '' });
  const [saving, setSaving] = useState(false);
  const limit = 25;

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('q', search);
    const res = await crmFetch(`/api/admin/crm/companies?${params}`);
    if (res.ok) { setCompanies(res.data); setTotal(res.total); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);
  useEffect(() => { setPage(1); }, [search]);

  async function handleAdd() {
    setSaving(true);
    const body: Record<string, string> = {};
    Object.entries(addForm).forEach(([k, v]) => { if (v.trim()) body[k] = v.trim(); });
    const res = await crmFetch('/api/admin/crm/companies', { method: 'POST', body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) {
      setShowAdd(false);
      setAddForm({ name: '', domain: '', phone: '', city: '', state: '', industry: '', source: '', rating: '' });
      fetchCompanies();
    }
  }

  const ratingColor = (r: string | null) => {
    if (!r) return 'text-slate-500';
    if (r === 'hot') return 'text-red-400';
    if (r === 'warm') return 'text-amber-400';
    return 'text-blue-400';
  };

  const inputCls = 'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="text-sm text-slate-400 mt-1">{total} total compan{total !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Company
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <SearchBar value={search} onChange={setSearch} placeholder="Search companies..." />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Domain</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">State</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Loading...</td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No companies found</td></tr>
              ) : (
                companies.map((company) => (
                  <tr
                    key={String(company.id)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/crm/companies/${company.id}`)}
                  >
                    <td className="px-4 py-3 text-white font-medium">{company.name}</td>
                    <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{company.domain || '-'}</td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{company.phone || '-'}</td>
                    <td className="px-4 py-3 text-slate-300 hidden md:table-cell">{company.city || '-'}</td>
                    <td className="px-4 py-3 text-slate-300 hidden md:table-cell">{company.state || '-'}</td>
                    <td className={`px-4 py-3 font-medium capitalize ${ratingColor(company.rating)}`}>
                      {company.rating || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell whitespace-nowrap">
                      {company.created_at ? new Date(company.created_at).toLocaleDateString() : '--'}
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

      {/* Add Company Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Company">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Company Name</label>
            <input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Domain</label>
            <input type="text" value={addForm.domain} onChange={(e) => setAddForm({ ...addForm, domain: e.target.value })} placeholder="example.com" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
            <input type="tel" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">City</label>
              <input type="text" value={addForm.city} onChange={(e) => setAddForm({ ...addForm, city: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">State</label>
              <input type="text" value={addForm.state} onChange={(e) => setAddForm({ ...addForm, state: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Industry</label>
              <input type="text" value={addForm.industry} onChange={(e) => setAddForm({ ...addForm, industry: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Source</label>
              <input type="text" value={addForm.source} onChange={(e) => setAddForm({ ...addForm, source: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Rating</label>
            <select value={addForm.rating} onChange={(e) => setAddForm({ ...addForm, rating: e.target.value })} className={inputCls}>
              <option value="">Select rating</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button
              onClick={handleAdd}
              disabled={saving || !addForm.name}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Add Company'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
