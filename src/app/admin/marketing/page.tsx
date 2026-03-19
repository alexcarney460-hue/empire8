'use client';

import { useEffect, useState, useCallback } from 'react';

type ContentType = 'blog_post' | 'social_media' | 'email_campaign' | 'newsletter';
type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived';

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  body: string;
  status: ContentStatus;
  platform: string | null;
  tags: string[];
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
}

type FilterTab = 'all' | 'draft' | 'scheduled' | 'published';

const TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'newsletter', label: 'Newsletter' },
];

const TYPE_COLORS: Record<ContentType, { bg: string; color: string }> = {
  blog_post: { bg: '#dbeafe', color: '#1e40af' },
  social_media: { bg: '#ede9fe', color: '#6d28d9' },
  email_campaign: { bg: '#dcfce7', color: '#166534' },
  newsletter: { bg: '#fef3c7', color: '#92400e' },
};

const STATUS_COLORS: Record<ContentStatus, { bg: string; color: string }> = {
  draft: { bg: '#f3f4f6', color: '#4b5563' },
  scheduled: { bg: '#fef3c7', color: '#92400e' },
  published: { bg: '#dcfce7', color: '#166534' },
  archived: { bg: '#f1f5f9', color: '#475569' },
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'published', label: 'Published' },
];

const EMPTY_FORM = {
  title: '',
  type: 'blog_post' as ContentType,
  body: '',
  platform: '',
  tags: '',
  scheduled_at: '',
};

function apiFetch(path: string, opts: RequestInit = {}) {
  const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? '';
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  return fetch(path, { ...opts, headers }).then((r) => r.json());
}

function fmtDate(iso: string | null) {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function MarketingPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const statusParam = filter !== 'all' ? `?status=${filter}` : '';
    const json = await apiFetch(`/api/admin/marketing/queue${statusParam}`);
    if (json.ok) setItems(json.data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item: ContentItem) => {
    setEditId(String(item.id));
    setForm({
      title: item.title,
      type: item.type,
      body: item.body ?? '',
      platform: item.platform ?? '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      scheduled_at: item.scheduled_at ? item.scheduled_at.slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      title: form.title,
      type: form.type,
      body: form.body,
      platform: form.platform || null,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      scheduled_at: form.scheduled_at || null,
      status: form.scheduled_at ? 'scheduled' : 'draft',
    };
    if (editId) {
      await apiFetch(`/api/admin/marketing/queue/${editId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    } else {
      await apiFetch('/api/admin/marketing/queue', { method: 'POST', body: JSON.stringify(payload) });
    }
    setSaving(false);
    setShowModal(false);
    load();
  };

  const handlePublish = async (id: string) => {
    await apiFetch(`/api/admin/marketing/publish/${id}`, { method: 'POST' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this content item?')) return;
    await apiFetch(`/api/admin/marketing/queue/${id}`, { method: 'DELETE' });
    load();
  };

  const filtered = items;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid var(--color-border, #e4e1db)',
    borderRadius: 10,
    padding: '9px 14px',
    fontSize: '0.85rem',
    color: 'var(--color-charcoal, #1c1c1c)',
    backgroundColor: '#fafaf9',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-charcoal, #1c1c1c)', margin: 0 }}>Marketing</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray, #9a9590)', margin: '4px 0 0' }}>Content queue & publishing pipeline</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            backgroundColor: 'var(--color-royal, #4A0E78)',
            color: '#fff',
            border: 'none',
            borderRadius: 9999,
            padding: '10px 22px',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          + New Content
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '7px 18px',
              borderRadius: 9999,
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: filter === tab.key ? 'var(--color-royal, #4A0E78)' : '#f3f4f6',
              color: filter === tab.key ? '#fff' : 'var(--color-warm-gray, #9a9590)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-warm-gray)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-warm-gray)' }}>No content items found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((item) => {
            const tc = TYPE_COLORS[item.type] ?? TYPE_COLORS.blog_post;
            const sc = STATUS_COLORS[item.status] ?? STATUS_COLORS.draft;
            return (
              <div
                key={String(item.id)}
                style={{
                  background: '#fff',
                  border: '1px solid var(--color-border, #e4e1db)',
                  borderRadius: 16,
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: tc.bg, color: tc.color }}>
                      {TYPE_OPTIONS.find((o) => o.value === item.type)?.label ?? item.type}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: sc.bg, color: sc.color }}>
                      {item.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-charcoal)', margin: 0 }}>{item.title}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-warm-gray)', margin: '4px 0 0' }}>
                    Created {fmtDate(item.created_at)}
                    {item.scheduled_at && <> &middot; Scheduled {fmtDate(item.scheduled_at)}</>}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {(item.status === 'draft' || item.status === 'scheduled') && (
                    <button
                      onClick={() => handlePublish(String(item.id))}
                      style={{ padding: '6px 14px', borderRadius: 9999, border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', backgroundColor: '#dcfce7', color: '#166534' }}
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(item)}
                    style={{ padding: '6px 14px', borderRadius: 9999, border: '1px solid var(--color-border)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', backgroundColor: '#fff', color: 'var(--color-charcoal)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(String(item.id))}
                    style={{ padding: '6px 14px', borderRadius: 9999, border: '1px solid #fecaca', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', backgroundColor: '#fef2f2', color: '#dc2626' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '32px 28px',
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-charcoal)', margin: '0 0 20px' }}>
              {editId ? 'Edit Content' : 'New Content'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 4 }}>Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Content title"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 4 }}>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as ContentType })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 4 }}>Body</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Content body..."
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 4 }}>Platform</label>
                  <input
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    placeholder="e.g., Instagram"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 4 }}>Tags</label>
                  <input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="tag1, tag2"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 4 }}>Schedule For</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '9px 20px', borderRadius: 9999, border: '1px solid var(--color-border)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', backgroundColor: '#fff', color: 'var(--color-charcoal)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                style={{
                  padding: '9px 20px',
                  borderRadius: 9999,
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  backgroundColor: 'var(--color-royal, #4A0E78)',
                  color: '#fff',
                  opacity: saving || !form.title.trim() ? 0.5 : 1,
                }}
              >
                {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
