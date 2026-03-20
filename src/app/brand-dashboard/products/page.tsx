'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Package, Plus, Check, X } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

interface Product {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly category: string;
  readonly description: string | null;
  readonly unit_price_cents: number;
  readonly unit_type: string;
  readonly min_order_qty: number;
  readonly is_available: boolean;
  readonly created_at: string;
}

interface NewProductForm {
  name: string;
  category: string;
  description: string;
  unit_price_dollars: string;
  unit_type: string;
  min_order_qty: string;
}

/* ── Constants ─────────────────────────────────────────────────────── */

const COLORS = {
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(200,162,60,0.12)',
  gold: '#C8A23C',
  goldSubtle: 'rgba(200,162,60,0.10)',
  textPrimary: '#fff',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.4)',
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(200,162,60,0.2)',
  successBg: 'rgba(34,197,94,0.15)',
  successText: '#4ade80',
  errorBg: 'rgba(239,68,68,0.15)',
  errorText: '#f87171',
} as const;

const CATEGORIES = [
  'Flower', 'Concentrates', 'Edibles', 'Pre-Rolls',
  'Vape', 'Topicals', 'Tinctures', 'Accessories', 'Other',
] as const;

const UNIT_TYPES = ['unit', 'g', 'oz', 'lb', 'ml', 'pack', 'case'] as const;

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: `1px solid ${COLORS.inputBorder}`,
  fontSize: '0.85rem',
  color: COLORS.textPrimary,
  background: COLORS.inputBg,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: '0.65rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: COLORS.textMuted,
  fontFamily: "'Barlow', Arial, sans-serif",
};

const EMPTY_FORM: NewProductForm = {
  name: '',
  category: '',
  description: '',
  unit_price_dollars: '',
  unit_type: 'unit',
  min_order_qty: '1',
};

/* ── Helpers ───────────────────────────────────────────────────────── */

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function BrandProductsPage() {
  const [products, setProducts] = useState<readonly Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<NewProductForm>({ ...EMPTY_FORM });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [patchError, setPatchError] = useState('');

  // Load products
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/brand-dashboard/products');
        if (cancelled) return;

        if (!res.ok) {
          setError('Unable to load products.');
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (json.ok) setProducts(json.data ?? []);
      } catch {
        if (!cancelled) setError('Unable to load products.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Toggle availability
  const toggleAvailability = useCallback(async (product: Product) => {
    setPatchError('');
    const newAvailable = !product.is_available;

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => p.id === product.id ? { ...p, is_available: newAvailable } : p),
    );

    try {
      const res = await fetch('/api/brand-dashboard/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, is_available: newAvailable }),
      });

      const json = await res.json();
      if (!json.ok) {
        // Revert
        setProducts((prev) =>
          prev.map((p) => p.id === product.id ? { ...p, is_available: product.is_available } : p),
        );
        setPatchError(json.error || 'Failed to update availability.');
      }
    } catch {
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, is_available: product.is_available } : p),
      );
      setPatchError('Failed to update availability.');
    }
  }, []);

  // Save inline price edit
  const savePrice = useCallback(async (productId: string) => {
    setPatchError('');
    const dollars = parseFloat(editPrice);
    if (isNaN(dollars) || dollars < 0) {
      setPatchError('Invalid price.');
      return;
    }

    const cents = Math.round(dollars * 100);

    try {
      const res = await fetch('/api/brand-dashboard/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, unit_price_cents: cents }),
      });

      const json = await res.json();
      if (json.ok) {
        setProducts((prev) =>
          prev.map((p) => p.id === productId ? { ...p, unit_price_cents: cents } : p),
        );
        setEditingId(null);
      } else {
        setPatchError(json.error || 'Failed to update price.');
      }
    } catch {
      setPatchError('Failed to update price.');
    }
  }, [editPrice]);

  // Add product
  const handleAdd = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);

    const dollars = parseFloat(form.unit_price_dollars);
    if (isNaN(dollars) || dollars < 0) {
      setAddError('Valid price is required.');
      setAddLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/brand-dashboard/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          description: form.description,
          unit_price_cents: Math.round(dollars * 100),
          unit_type: form.unit_type,
          min_order_qty: parseInt(form.min_order_qty, 10) || 1,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setProducts((prev) => [...prev, json.data]);
        setForm({ ...EMPTY_FORM });
        setShowAddForm(false);
      } else {
        setAddError(json.error || 'Failed to add product.');
      }
    } catch {
      setAddError('Failed to add product.');
    } finally {
      setAddLoading(false);
    }
  }, [form]);

  const handleFormChange = useCallback((field: keyof NewProductForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: `3px solid ${COLORS.cardBorder}`,
            borderTopColor: COLORS.gold,
            animation: 'e8-spin 0.7s linear infinite',
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: COLORS.errorBg,
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12,
          padding: '20px 24px',
          color: COLORS.errorText,
          fontSize: '0.88rem',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1
            style={{
              fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
              fontWeight: 700,
              color: COLORS.textPrimary,
              margin: '0 0 6px 0',
            }}
          >
            My Products
          </h1>
          <p style={{ fontSize: '0.88rem', color: COLORS.textSecondary, margin: 0 }}>
            Manage your product catalog. {products.length} product{products.length !== 1 ? 's' : ''} total.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: showAddForm ? 'transparent' : COLORS.gold,
            color: showAddForm ? COLORS.gold : '#1A0633',
            padding: '10px 20px',
            borderRadius: 9999,
            border: showAddForm ? `1px solid ${COLORS.cardBorder}` : 'none',
            fontFamily: "'Barlow', Arial, sans-serif",
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {showAddForm ? (
            <>Cancel</>
          ) : (
            <><Plus size={14} /> Add Product</>
          )}
        </button>
      </div>

      {/* Patch error */}
      {patchError && (
        <div
          style={{
            backgroundColor: COLORS.errorBg,
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10,
            padding: '10px 14px',
            color: COLORS.errorText,
            fontSize: '0.82rem',
            marginBottom: 16,
          }}
        >
          {patchError}
        </div>
      )}

      {/* Add product form */}
      {showAddForm && (
        <div
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 16,
            padding: '24px',
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.gold,
              margin: '0 0 20px 0',
              fontFamily: "'Barlow', Arial, sans-serif",
            }}
          >
            New Product
          </p>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Product Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  style={inputStyle}
                  placeholder="Product name"
                />
              </div>
              <div>
                <label style={labelStyle}>Category *</label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
                placeholder="Optional description"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Price (USD) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.unit_price_dollars}
                  onChange={(e) => handleFormChange('unit_price_dollars', e.target.value)}
                  style={inputStyle}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label style={labelStyle}>Unit Type</label>
                <select
                  value={form.unit_type}
                  onChange={(e) => handleFormChange('unit_type', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {UNIT_TYPES.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Min Order Qty</label>
                <input
                  type="number"
                  min="1"
                  value={form.min_order_qty}
                  onChange={(e) => handleFormChange('min_order_qty', e.target.value)}
                  style={inputStyle}
                  placeholder="1"
                />
              </div>
            </div>

            {addError && (
              <div
                style={{
                  fontSize: '0.82rem',
                  color: COLORS.errorText,
                  backgroundColor: COLORS.errorBg,
                  borderRadius: 10,
                  padding: '10px 14px',
                }}
              >
                {addError}
              </div>
            )}

            <button
              type="submit"
              disabled={addLoading}
              style={{
                alignSelf: 'flex-start',
                backgroundColor: addLoading ? COLORS.textMuted : COLORS.gold,
                color: '#1A0633',
                border: 'none',
                borderRadius: 9999,
                padding: '10px 24px',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: addLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {addLoading ? 'Adding...' : 'Add Product'}
            </button>
          </form>
        </div>
      )}

      {/* Products table */}
      {products.length === 0 ? (
        <div
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 16,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <Package size={32} color={COLORS.textMuted} style={{ marginBottom: 16 }} />
          <p style={{ color: COLORS.textSecondary, fontSize: '0.9rem', margin: '0 0 8px' }}>
            No products yet. Add your first product or upload a CSV menu.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
              gap: 8,
              padding: '12px 20px',
              borderBottom: `1px solid ${COLORS.cardBorder}`,
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: COLORS.textMuted,
              fontFamily: "'Barlow', Arial, sans-serif",
            }}
          >
            <span>Name</span>
            <span>Category</span>
            <span>Price</span>
            <span>Unit</span>
            <span>Min Order</span>
            <span>Available</span>
          </div>

          {/* Table rows */}
          {products.map((product, idx) => (
            <div
              key={product.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
                gap: 8,
                padding: '14px 20px',
                borderBottom: idx < products.length - 1 ? `1px solid ${COLORS.cardBorder}` : 'none',
                alignItems: 'center',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>
                {product.name}
              </span>
              <span style={{ color: COLORS.textSecondary }}>
                {product.category}
              </span>

              {/* Inline price edit */}
              <span>
                {editingId === product.id ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      style={{
                        ...inputStyle,
                        width: 80,
                        padding: '4px 8px',
                        fontSize: '0.82rem',
                      }}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') savePrice(product.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <button
                      onClick={() => savePrice(product.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                      aria-label="Save price"
                    >
                      <Check size={14} color={COLORS.successText} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                      aria-label="Cancel edit"
                    >
                      <X size={14} color={COLORS.textMuted} />
                    </button>
                  </span>
                ) : (
                  <span
                    onClick={() => {
                      setEditingId(product.id);
                      setEditPrice((product.unit_price_cents / 100).toFixed(2));
                      setPatchError('');
                    }}
                    style={{
                      color: COLORS.textPrimary,
                      cursor: 'pointer',
                      borderBottom: `1px dashed ${COLORS.textMuted}`,
                    }}
                    title="Click to edit price"
                  >
                    {formatCurrency(product.unit_price_cents)}
                  </span>
                )}
              </span>

              <span style={{ color: COLORS.textSecondary }}>
                {product.unit_type}
              </span>
              <span style={{ color: COLORS.textSecondary }}>
                {product.min_order_qty}
              </span>

              {/* Availability toggle */}
              <span>
                <button
                  onClick={() => toggleAvailability(product)}
                  aria-label={product.is_available ? 'Mark unavailable' : 'Mark available'}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    backgroundColor: product.is_available ? COLORS.gold : 'rgba(255,255,255,0.1)',
                    transition: 'background-color 200ms ease',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      position: 'absolute',
                      top: 3,
                      left: product.is_available ? 23 : 3,
                      transition: 'left 200ms ease',
                    }}
                  />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
