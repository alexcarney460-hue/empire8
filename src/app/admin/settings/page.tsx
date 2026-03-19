'use client';

import { useEffect, useState, useCallback } from 'react';
import { SHIPPING_TIERS } from '@/lib/shipping';

/* types */

type ProductRow = {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  category: string;
  price: number;
  unit: string;
  badge: string | null;
  img: string;
  description: string;
  in_stock: boolean;
  sort_order: number;
  quantity_on_hand: number;
  low_stock_threshold: number;
};

type AdminConfig = {
  admin_email: string;
  supabase_domain: string;
  features: {
    email_notifications: boolean;
    auto_approve_wholesale: boolean;
    maintenance_mode: boolean;
  };
};

const PRICING_TIERS = [
  { name: 'Retail', discount: '$80/case', label: '$8/box · 1–29 cases', color: '#4A0E78', minOrder: '1 case' },
  { name: 'Wholesale', discount: '$70/case', label: 'Save $10/case · $7/box', color: '#C8A23C', minOrder: '30 cases' },
  { name: 'Distribution', discount: '$60/case', label: 'Save $20/case · $6/box', color: '#1C1C1C', minOrder: '120 cases' },
];

/* helpers */

const TOKEN = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? '' : '';

function authHeaders() {
  return { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
}

/* shared styles */

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 600,
  color: '#9A9590',
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};

const inputStyle: React.CSSProperties = {
  display: 'block',
  padding: '8px 10px',
  borderRadius: 10,
  border: '1px solid #E4E1DB',
  fontSize: '0.88rem',
  color: '#1C1C1C',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
};
/* component */

export default function SettingsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productsSource, setProductsSource] = useState<string>('');
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProductRow>>({});
  const [saving, setSaving] = useState(false);
  const [inventoryUpdates, setInventoryUpdates] = useState<Record<number, { qty: string; saving: boolean }>>({});

  async function updateInventory(productId: number, field: 'quantity_on_hand' | 'low_stock_threshold', value: number) {
    setInventoryUpdates((prev) => ({ ...prev, [productId]: { ...prev[productId], saving: true, qty: prev[productId]?.qty ?? '' } }));
    try {
      const res = await fetch('/api/admin/settings/products', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ id: productId, [field]: value }),
      });
      const json = await res.json();
      if (json.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, [field]: value } : p))
        );
      } else {
        alert(json.error || 'Update failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setInventoryUpdates((prev) => ({ ...prev, [productId]: { ...prev[productId], saving: false, qty: '' } }));
    }
  }

  async function addInventory(productId: number) {
    const addQty = parseInt(inventoryUpdates[productId]?.qty || '0');
    if (!addQty || addQty <= 0) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    await updateInventory(productId, 'quantity_on_hand', product.quantity_on_hand + addQty);
    setInventoryUpdates((prev) => ({ ...prev, [productId]: { qty: '', saving: false } }));
  }

  const [features, setFeatures] = useState({
    email_notifications: true,
    auto_approve_wholesale: false,
    maintenance_mode: false,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, cfgRes] = await Promise.all([
        fetch('/api/admin/settings/products', { headers: authHeaders() }),
        fetch('/api/admin/settings/config', { headers: authHeaders() }),
      ]);
      const prodJson = await prodRes.json();
      const cfgJson = await cfgRes.json();

      if (prodJson.ok) {
        setProducts(prodJson.products);
        setProductsSource(prodJson.source);
      }
      if (cfgJson.ok) {
        setConfig(cfgJson);
        setFeatures(cfgJson.features);
      }
    } catch (err) {
      console.error('Settings fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function startEdit(p: ProductRow) {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      price: p.price,
      sort_order: p.sort_order,
      img: p.img,
      description: p.description,
      category: p.category,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit() {
    if (editingId === null) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/products', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      const json = await res.json();
      if (json.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...editForm } as ProductRow : p))
        );
        setEditingId(null);
        setEditForm({});
      } else {
        alert(json.error || 'Save failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  }
  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-warm-gray)' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px 80px' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-charcoal)', marginBottom: 8 }}>
        Settings
      </h1>
      <p style={{ color: 'var(--color-warm-gray)', fontSize: '0.9rem', marginBottom: 40 }}>
        Manage products, pricing tiers, and admin configuration.
      </p>

      {/* PRODUCT MANAGEMENT */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 4 }}>
          Product Management
        </h2>
        <p style={{ color: 'var(--color-warm-gray)', fontSize: '0.82rem', marginBottom: 20 }}>
          {products.length} products &middot; Source: {productsSource === 'db' ? 'Database' : 'Static (products.ts)'}
          {productsSource === 'static' && (
            <span style={{ marginLeft: 8, color: '#C8A23C', fontWeight: 600 }}>
              Read-only &mdash; create a Supabase products table to enable editing
            </span>
          )}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {products.map((p) => {
            const isEditing = editingId === p.id;

            return (
              <div
                key={p.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 16,
                  padding: 20,
                  transition: 'box-shadow 150ms',
                  boxShadow: isEditing ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {!isEditing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#f4f3f1', border: '1px solid var(--color-border)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-charcoal)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-warm-gray)', marginTop: 2 }}>
                        {p.category}
                        {p.badge && (
                          <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 9999, background: 'var(--color-royal)', color: '#fff', fontSize: '0.7rem', fontWeight: 600 }}>
                            {p.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: 80 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-charcoal)' }}>
                        ${p.price.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-warm-gray)' }}>{p.unit}</div>
                    </div>

                    <div style={{ textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-warm-gray)', marginBottom: 2 }}>Stock</div>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: p.quantity_on_hand <= 0
                          ? '#DC2626'
                          : p.quantity_on_hand <= p.low_stock_threshold
                            ? '#D97706'
                            : '#16A34A',
                      }}>
                        {p.quantity_on_hand}
                        {p.quantity_on_hand <= p.low_stock_threshold && p.quantity_on_hand > 0 && (
                          <span style={{ fontSize: '0.65rem', display: 'block', color: '#D97706' }}>Low</span>
                        )}
                        {p.quantity_on_hand <= 0 && (
                          <span style={{ fontSize: '0.65rem', display: 'block', color: '#DC2626' }}>Out</span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', minWidth: 60 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-warm-gray)', marginBottom: 2 }}>Sort</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-charcoal)' }}>{p.sort_order}</div>
                    </div>

                    <button
                      onClick={() => startEdit(p)}
                      style={{ padding: '7px 18px', borderRadius: 9999, border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-charcoal)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 }}
                    >
                      Edit
                    </button>
                  </div>
                )}
                {isEditing && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-charcoal)', marginBottom: 14 }}>
                      Editing: {p.name}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                      <label style={{ flex: '1 1 100%' }}>
                        <span style={labelStyle}>Name</span>
                        <input type="text" value={editForm.name ?? ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
                      </label>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                      <label style={{ width: 100 }}>
                        <span style={labelStyle}>Price ($)</span>
                        <input type="number" step="0.01" value={editForm.price ?? ''} onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, width: '100%' }} />
                      </label>
                      <label style={{ width: 72 }}>
                        <span style={labelStyle}>Sort Order</span>
                        <input type="number" value={editForm.sort_order ?? ''} onChange={(e) => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) || 0 })} style={{ ...inputStyle, width: '100%' }} />
                      </label>
                      <label style={{ width: 140 }}>
                        <span style={labelStyle}>Category</span>
                        <select value={editForm.category ?? ''} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
                          <option value="Gloves">Gloves</option>
                          <option value="Trimmers">Trimmers</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </label>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                      <label style={{ flex: '1 1 auto', minWidth: 140 }}>
                        <span style={labelStyle}>Image URL</span>
                        <input type="text" value={editForm.img ?? ''} onChange={(e) => setEditForm({ ...editForm, img: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
                      </label>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label>
                        <span style={labelStyle}>Description</span>
                        <textarea rows={3} value={editForm.description ?? ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
                      </label>
                    </div>

                    {/* INVENTORY CONTROLS */}
                    <div style={{ background: '#FAFAF8', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                      <div style={{ ...labelStyle, marginBottom: 12, fontSize: '0.78rem' }}>Inventory</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
                        <div>
                          <span style={labelStyle}>Current Stock</span>
                          <div style={{
                            fontWeight: 800,
                            fontSize: '1.4rem',
                            color: p.quantity_on_hand <= 0
                              ? '#DC2626'
                              : p.quantity_on_hand <= p.low_stock_threshold
                                ? '#D97706'
                                : '#16A34A',
                          }}>
                            {p.quantity_on_hand}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                          <label>
                            <span style={labelStyle}>Add Qty</span>
                            <input
                              type="number"
                              min="1"
                              placeholder="0"
                              value={inventoryUpdates[p.id]?.qty ?? ''}
                              onChange={(e) => setInventoryUpdates((prev) => ({
                                ...prev,
                                [p.id]: { ...prev[p.id], qty: e.target.value, saving: prev[p.id]?.saving ?? false },
                              }))}
                              style={{ ...inputStyle, width: 80 }}
                            />
                          </label>
                          <button
                            onClick={() => addInventory(p.id)}
                            disabled={inventoryUpdates[p.id]?.saving || !inventoryUpdates[p.id]?.qty}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 9999,
                              border: 'none',
                              background: '#16A34A',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: inventoryUpdates[p.id]?.saving ? 'not-allowed' : 'pointer',
                              opacity: inventoryUpdates[p.id]?.saving || !inventoryUpdates[p.id]?.qty ? 0.5 : 1,
                              marginBottom: 1,
                            }}
                          >
                            {inventoryUpdates[p.id]?.saving ? 'Adding...' : '+ Add Stock'}
                          </button>
                        </div>
                        <label>
                          <span style={labelStyle}>Set Exact Qty</span>
                          <input
                            type="number"
                            min="0"
                            defaultValue={p.quantity_on_hand}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val !== p.quantity_on_hand) {
                                updateInventory(p.id, 'quantity_on_hand', val);
                              }
                            }}
                            style={{ ...inputStyle, width: 80 }}
                          />
                        </label>
                        <label>
                          <span style={labelStyle}>Low Stock Alert</span>
                          <input
                            type="number"
                            min="0"
                            defaultValue={p.low_stock_threshold}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val !== p.low_stock_threshold) {
                                updateInventory(p.id, 'low_stock_threshold', val);
                              }
                            }}
                            style={{ ...inputStyle, width: 80 }}
                          />
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={saveEdit} disabled={saving} style={{ padding: '8px 22px', borderRadius: 9999, border: 'none', background: 'var(--color-royal)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button onClick={cancelEdit} style={{ padding: '8px 22px', borderRadius: 9999, border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-charcoal)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      {/* PRICING TIERS */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 4 }}>
          Pricing Tiers
        </h2>
        <p style={{ color: 'var(--color-warm-gray)', fontSize: '0.82rem', marginBottom: 20 }}>
          Retail, Wholesale, and Distribution tiers from pricing.ts.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {PRICING_TIERS.map((tier) => (
            <div key={tier.name} style={{ flex: '1 1 200px', background: '#fff', border: '1px solid var(--color-border)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
              <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 9999, background: tier.color, color: '#fff', fontSize: '0.78rem', fontWeight: 700, marginBottom: 12 }}>
                {tier.name}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-charcoal)', marginBottom: 4 }}>
                {tier.discount === '0%' ? 'Full Price' : `${tier.discount} off`}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray)', marginBottom: 8 }}>
                {tier.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-warm-gray)', borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                Min order: {tier.minOrder}
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* SHIPPING RATES */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 4 }}>
          Shipping Rates
        </h2>
        <p style={{ color: 'var(--color-warm-gray)', fontSize: '0.82rem', marginBottom: 20 }}>
          Weight-based shipping estimate tiers. Actual rates determined by Shippo at fulfillment.
        </p>

        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 16, padding: 24 }}>

          {/* Rate table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--color-warm-gray)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Weight Range</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--color-warm-gray)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tier</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--color-warm-gray)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {SHIPPING_TIERS.map((tier, i) => {
                const prevMax = i > 0 ? SHIPPING_TIERS[i - 1].maxLbs : 0;
                return (
                  <tr key={tier.label} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--color-charcoal)', fontWeight: 600 }}>
                      {prevMax}–{tier.maxLbs} lbs
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-warm-gray)' }}>
                      {tier.label}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--color-charcoal)', fontFamily: 'monospace' }}>
                      ${tier.rate.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p style={{ fontSize: '0.75rem', color: 'var(--color-warm-gray)', marginTop: 14, fontStyle: 'italic' }}>
            Rates are based on total order weight. Product weights are configured per-product in the database.
          </p>
        </div>
      </section>

      {/* PRODUCT WEIGHTS */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 4 }}>
          Product Weights
        </h2>
        <p style={{ color: 'var(--color-warm-gray)', fontSize: '0.82rem', marginBottom: 20 }}>
          Weight per unit ({products.length} products). Used for shipping calculation.
        </p>

        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--color-warm-gray)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Product</th>
                <th style={{ textAlign: 'center', padding: '10px 16px', color: 'var(--color-warm-gray)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unit</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--color-warm-gray)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Weight (lbs)</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--color-charcoal)' }}>{p.short_name}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--color-warm-gray)' }}>{p.unit}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      defaultValue={(p as ProductRow & { weight_lbs?: number }).weight_lbs ?? 5}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0) {
                          fetch('/api/admin/settings/products', {
                            method: 'PATCH',
                            headers: authHeaders(),
                            body: JSON.stringify({ id: p.id, weight_lbs: val }),
                          });
                        }
                      }}
                      style={{
                        ...inputStyle,
                        width: 70,
                        textAlign: 'right',
                        fontWeight: 700,
                        display: 'inline-block',
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ADMIN CONFIG */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 4 }}>
          Admin Configuration
        </h2>
        <p style={{ color: 'var(--color-warm-gray)', fontSize: '0.82rem', marginBottom: 20 }}>
          Environment and feature flags.
        </p>

        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 28 }}>
            <div style={{ flex: '1 1 240px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-warm-gray)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Admin Email
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-charcoal)' }}>
                {config?.admin_email ?? '\u2014'}
              </div>
            </div>
            <div style={{ flex: '1 1 240px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-warm-gray)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Supabase Domain
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-charcoal)', fontFamily: 'monospace' }}>
                {config?.supabase_domain ?? '\u2014'}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-warm-gray)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Feature Flags
            </div>

            {([
              { key: 'email_notifications' as const, label: 'Email Notifications', desc: 'Send email alerts for new orders and inquiries' },
              { key: 'auto_approve_wholesale' as const, label: 'Auto-Approve Wholesale', desc: 'Automatically approve wholesale account applications' },
              { key: 'maintenance_mode' as const, label: 'Maintenance Mode', desc: 'Show maintenance page to non-admin visitors' },
            ]).map((flag) => (
              <div key={flag.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-charcoal)' }}>{flag.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-warm-gray)', marginTop: 2 }}>{flag.desc}</div>
                </div>
                <button
                  onClick={() => setFeatures((f) => ({ ...f, [flag.key]: !f[flag.key] }))}
                  style={{ position: 'relative', width: 44, height: 24, borderRadius: 9999, border: 'none', cursor: 'pointer', flexShrink: 0, background: features[flag.key] ? 'var(--color-royal)' : '#ccc', transition: 'background 200ms' }}
                >
                  <span style={{ position: 'absolute', top: 2, left: features[flag.key] ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 200ms' }} />
                </button>
              </div>
            ))}

            <p style={{ fontSize: '0.75rem', color: 'var(--color-warm-gray)', marginTop: 12, fontStyle: 'italic' }}>
              Toggle switches are visual-only for now. Backend persistence coming soon.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
