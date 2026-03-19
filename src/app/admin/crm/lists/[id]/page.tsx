'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { crmFetch } from '../../components/api';

interface Company {
  id: number;
  name: string;
  domain: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
}

interface ListData {
  id: number;
  name: string;
  description: string | null;
  created_at: string | null;
}

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [list, setList] = useState<ListData | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) q.set('q', search);
    const res = await crmFetch(`/api/admin/crm/lists/${id}?${q}`);
    if (res.ok) {
      setList(res.data);
      setCompanies(res.companies ?? []);
      setTotal(res.totalCompanies ?? 0);
    }
    setLoading(false);
  }, [id, page, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link href="/admin/crm/lists" className="text-sm text-slate-400 hover:text-sky-400 transition-colors mb-1 inline-block">
            &larr; Back to Lists
          </Link>
          <h1 className="text-2xl font-bold text-white">{list?.name || 'Loading...'}</h1>
          {list?.description && <p className="text-sm text-slate-400 mt-1">{list.description}</p>}
        </div>
        <div className="text-sm text-slate-400 font-medium">
          {total} {total === 1 ? 'company' : 'companies'}
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search companies..."
          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button type="submit" className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors">
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="px-3 py-2 text-slate-400 hover:text-white text-sm transition-colors">
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Website</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-500">Loading...</td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-500">{search ? 'No matches found.' : 'No companies in this list.'}</td></tr>
              ) : (
                companies.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/crm/companies/${c.id}`} className="text-white font-medium hover:text-sky-400 transition-colors">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {[c.city, c.state].filter(Boolean).join(', ') || '--'}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{c.phone || '--'}</td>
                    <td className="px-4 py-3">
                      {c.domain ? (
                        <a href={`https://${c.domain}`} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 transition-colors">
                          {c.domain}
                        </a>
                      ) : '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-30 hover:bg-slate-700 transition-colors"
          >
            Previous
          </button>
          <span className="text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-30 hover:bg-slate-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
