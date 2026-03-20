'use client';

import { useEffect, useState, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  contact_email: string;
  category: string | null;
  website: string | null;
  logo_url: string | null;
  is_active: boolean;
  product_count: number;
};

type BrandProduct = {
  id: string;
  brand_id: string;
  brand_name: string | null;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  unit_price_cents: number;
  unit_type: string;
  min_order_qty: number;
  image_url: string | null;
  is_available: boolean;
};

type NewBrandForm = {
  name: string;
  slug: string;
  description: string;
  contact_email: string;
  category: string;
  website: string;
  logo_url: string;
};

type NewProductForm = {
  name: string;
  slug: string;
  description: string;
  category: string;
  unit_price_cents: string;
  unit_type: string;
  min_order_qty: string;
  image_url: string;
};

type FeatureFlags = {
  email_notifications: boolean;
  auto_approve_dispensaries: boolean;
  maintenance_mode: boolean;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TOKEN = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? ''
  : '';

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
}

function generateSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

const EMPTY_BRAND_FORM: NewBrandForm = {
  name: '', slug: '', description: '', contact_email: '',
  category: '', website: '', logo_url: '',
};

const EMPTY_PRODUCT_FORM: NewProductForm = {
  name: '', slug: '', description: '', category: '',
  unit_price_cents: '', unit_type: 'unit', min_order_qty: '1', image_url: '',
};

const FEATURE_FLAG_STORAGE_KEY = 'empire8_admin_feature_flags';

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const colors = {
  bg: '#0F0520',
  surface: '#1A0E2E',
  surfaceHover: '#241540',
  border: '#2E1F4A',
  text: '#E8E0F0',
  textMuted: '#8A7BA0',
  accent: '#7C3AED',
  accentHover: '#6D28D9',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  inputBg: '#150B28',
} as const;

const sectionStyle: React.CSSProperties = {
  marginBottom: 48,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 16,
  padding: 28,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 600,
  color: colors.textMuted,
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};

const inputStyle: React.CSSProperties = {
  display: 'block',
  padding: '8px 12px',
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  fontSize: '0.88rem',
  color: colors.text,
  background: colors.inputBg,
  outline: 'none',
  boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: 9999,
  border: 'none',
  background: colors.accent,
  color: '#fff',
  fontWeight: 700,
  fontSize: '0.82rem',
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: 9999,
  border: `1px solid ${colors.border}`,
  background: 'transparent',
  color: colors.text,
  fontWeight: 600,
  fontSize: '0.82rem',
  cursor: 'pointer',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  /* -- Brand state -- */
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [brandForm, setBrandForm] = useState<NewBrandForm>(EMPTY_BRAND_FORM);
  const [brandSaving, setBrandSaving] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editBrandForm, setEditBrandForm] = useState<Partial<Brand>>({});

  /* -- Product state -- */
  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState<NewProductForm>(EMPTY_PRODUCT_FORM);
  const [productSaving, setProductSaving] = useState(false);

  /* -- Config state -- */
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [features, setFeatures] = useState<FeatureFlags>({
    email_notifications: true,
    auto_approve_dispensaries: false,
    maintenance_mode: false,
  });

  /* ---------------------------------------------------------------- */
  /*  Data fetching                                                    */
  /* ---------------------------------------------------------------- */

  const fetchBrands = useCallback(async () => {
    setBrandsLoading(true);
    try {
      const res = await fetch('/api/admin/settings/brands', { headers: authHeaders() });
      const json = await res.json();
      if (json.ok) {
        setBrands(json.brands);
      }
    } catch (err) {
      console.error('Failed to fetch brands', err);
    } finally {
      setBrandsLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async (brandId: string) => {
    if (!brandId) {
      setProducts([]);
      return;
    }
    setProductsLoading(true);
    try {
      const res = await fetch(`/api/admin/settings/products?brand_id=${brandId}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.ok) {
        setProducts(json.products);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/config', { headers: authHeaders() });
      const json = await res.json();
      if (json.ok) {
        setAdminEmail(json.admin_email ?? '');
      }
    } catch (err) {
      console.error('Failed to fetch config', err);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
    fetchConfig();
  }, [fetchBrands, fetchConfig]);

  // Load feature flags from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FEATURE_FLAG_STORAGE_KEY);
      if (stored) {
        setFeatures(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Fetch products when brand selection changes
  useEffect(() => {
    fetchProducts(selectedBrandId);
  }, [selectedBrandId, fetchProducts]);

  /* ---------------------------------------------------------------- */
  /*  Brand actions                                                    */
  /* ---------------------------------------------------------------- */

  async function createBrand() {
    if (!brandForm.name.trim() || !brandForm.contact_email.trim()) return;
    setBrandSaving(true);
    try {
      const payload = {
        ...brandForm,
        slug: brandForm.slug.trim() || generateSlug(brandForm.name),
      };
      const res = await fetch('/api/admin/settings/brands', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        setBrands((prev) => [...prev, { ...json.brand, product_count: 0 }]);
        setBrandForm(EMPTY_BRAND_FORM);
        setShowBrandForm(false);
      } else {
        alert(json.error || 'Failed to create brand');
      }
    } catch {
      alert('Network error creating brand');
    } finally {
      setBrandSaving(false);
    }
  }

  async function toggleBrandActive(brand: Brand) {
    const newActive = !brand.is_active;
    try {
      const res = await fetch(`/api/admin/settings/brands/${brand.id}`, {
        method: newActive ? 'PATCH' : 'DELETE',
        headers: authHeaders(),
        ...(newActive ? { body: JSON.stringify({ is_active: true }) } : {}),
      });
      const json = await res.json();
      if (json.ok) {
        setBrands((prev) =>
          prev.map((b) => (b.id === brand.id ? { ...b, is_active: newActive } : b))
        );
      }
    } catch {
      alert('Network error toggling brand status');
    }
  }

  function startEditBrand(brand: Brand) {
    setEditingBrandId(brand.id);
    setEditBrandForm({
      name: brand.name,
      slug: brand.slug,
      contact_email: brand.contact_email,
      category: brand.category,
      description: brand.description,
      website: brand.website,
      logo_url: brand.logo_url,
    });
  }

  async function saveEditBrand() {
    if (!editingBrandId) return;
    try {
      const res = await fetch(`/api/admin/settings/brands/${editingBrandId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(editBrandForm),
      });
      const json = await res.json();
      if (json.ok) {
        setBrands((prev) =>
          prev.map((b) => (b.id === editingBrandId ? { ...b, ...editBrandForm } : b))
        );
        setEditingBrandId(null);
        setEditBrandForm({});
      } else {
        alert(json.error || 'Failed to update brand');
      }
    } catch {
      alert('Network error updating brand');
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Product actions                                                  */
  /* ---------------------------------------------------------------- */

  async function createProduct() {
    if (!productForm.name.trim() || !selectedBrandId) return;
    setProductSaving(true);
    try {
      const payload = {
        ...productForm,
        brand_id: selectedBrandId,
        slug: productForm.slug.trim() || generateSlug(productForm.name),
        unit_price_cents: parseInt(productForm.unit_price_cents) || 0,
        min_order_qty: parseInt(productForm.min_order_qty) || 1,
      };
      const res = await fetch('/api/admin/settings/products', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        setProducts((prev) => [...prev, json.product]);
        setProductForm(EMPTY_PRODUCT_FORM);
        setShowProductForm(false);
      } else {
        alert(json.error || 'Failed to create product');
      }
    } catch {
      alert('Network error creating product');
    } finally {
      setProductSaving(false);
    }
  }

  async function toggleProductAvailable(product: BrandProduct) {
    try {
      const res = await fetch('/api/admin/settings/products', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ id: product.id, is_available: !product.is_available }),
      });
      const json = await res.json();
      if (json.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_available: !product.is_available } : p))
        );
      }
    } catch {
      alert('Network error toggling availability');
    }
  }

  async function saveInlineEdit(productId: string, field: 'unit_price_cents' | 'min_order_qty', value: string) {
    const numVal = parseInt(value);
    if (isNaN(numVal) || numVal < 0) return;
    try {
      const res = await fetch('/api/admin/settings/products', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ id: productId, [field]: numVal }),
      });
      const json = await res.json();
      if (json.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, [field]: numVal } : p))
        );
      }
    } catch {
      alert('Network error updating product');
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Feature flag actions                                             */
  /* ---------------------------------------------------------------- */

  function toggleFeature(key: keyof FeatureFlags) {
    setFeatures((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(FEATURE_FLAG_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // storage full or disabled
      }
      return updated;
    });
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (brandsLoading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: colors.textMuted, background: colors.bg, minHeight: '100vh' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px 80px', background: colors.bg, minHeight: '100vh' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: colors.text, marginBottom: 8 }}>
        Settings
      </h1>
      <p style={{ color: colors.textMuted, fontSize: '0.9rem', marginBottom: 40 }}>
        Manage brands, product catalog, and admin configuration.
      </p>

      {/* ============================================================ */}
      {/*  SECTION 1: Brand Management                                  */}
      {/* ============================================================ */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: colors.text, marginBottom: 4 }}>
              Brand Management
            </h2>
            <p style={{ color: colors.textMuted, fontSize: '0.82rem', margin: 0 }}>
              {brands.length} brand{brands.length !== 1 ? 's' : ''} registered
            </p>
          </div>
          <button
            onClick={() => setShowBrandForm((v) => !v)}
            style={btnPrimary}
          >
            {showBrandForm ? 'Cancel' : 'Add Brand'}
          </button>
        </div>

        {/* Add Brand Form */}
        {showBrandForm && (
          <div style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: colors.text, marginBottom: 16 }}>
              New Brand
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <label style={{ flex: '1 1 200px' }}>
                <span style={labelStyle}>Name *</span>
                <input
                  type="text"
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value, slug: generateSlug(e.target.value) })}
                  style={{ ...inputStyle, width: '100%' }}
                  placeholder="Brand name"
                />
              </label>
              <label style={{ flex: '0 0 180px' }}>
                <span style={labelStyle}>Slug</span>
                <input
                  type="text"
                  value={brandForm.slug}
                  onChange={(e) => setBrandForm({ ...brandForm, slug: e.target.value })}
                  style={{ ...inputStyle, width: '100%', fontFamily: 'monospace', fontSize: '0.82rem' }}
                  placeholder="auto-generated"
                />
              </label>
              <label style={{ flex: '1 1 200px' }}>
                <span style={labelStyle}>Contact Email *</span>
                <input
                  type="email"
                  value={brandForm.contact_email}
                  onChange={(e) => setBrandForm({ ...brandForm, contact_email: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                  placeholder="brand@example.com"
                />
              </label>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <label style={{ flex: '1 1 160px' }}>
                <span style={labelStyle}>Category</span>
                <input
                  type="text"
                  value={brandForm.category}
                  onChange={(e) => setBrandForm({ ...brandForm, category: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                  placeholder="e.g. Edibles, Flower"
                />
              </label>
              <label style={{ flex: '1 1 200px' }}>
                <span style={labelStyle}>Website</span>
                <input
                  type="url"
                  value={brandForm.website}
                  onChange={(e) => setBrandForm({ ...brandForm, website: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                  placeholder="https://..."
                />
              </label>
              <label style={{ flex: '1 1 200px' }}>
                <span style={labelStyle}>Logo URL</span>
                <input
                  type="url"
                  value={brandForm.logo_url}
                  onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                  placeholder="https://..."
                />
              </label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>
                <span style={labelStyle}>Description</span>
                <textarea
                  rows={2}
                  value={brandForm.description}
                  onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
                  placeholder="Short brand description"
                />
              </label>
            </div>
            <button
              onClick={createBrand}
              disabled={brandSaving || !brandForm.name.trim() || !brandForm.contact_email.trim()}
              style={{ ...btnPrimary, opacity: brandSaving || !brandForm.name.trim() || !brandForm.contact_email.trim() ? 0.5 : 1 }}
            >
              {brandSaving ? 'Creating...' : 'Create Brand'}
            </button>
          </div>
        )}

        {/* Brand List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {brands.map((brand) => {
            const isEditing = editingBrandId === brand.id;

            if (isEditing) {
              return (
                <div key={brand.id} style={{ background: colors.inputBg, border: `1px solid ${colors.accent}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: colors.text, marginBottom: 14 }}>
                    Editing: {brand.name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                    <label style={{ flex: '1 1 180px' }}>
                      <span style={labelStyle}>Name</span>
                      <input type="text" value={editBrandForm.name ?? ''} onChange={(e) => setEditBrandForm({ ...editBrandForm, name: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
                    </label>
                    <label style={{ flex: '0 0 140px' }}>
                      <span style={labelStyle}>Slug</span>
                      <input type="text" value={editBrandForm.slug ?? ''} onChange={(e) => setEditBrandForm({ ...editBrandForm, slug: e.target.value })} style={{ ...inputStyle, width: '100%', fontFamily: 'monospace', fontSize: '0.82rem' }} />
                    </label>
                    <label style={{ flex: '1 1 180px' }}>
                      <span style={labelStyle}>Contact Email</span>
                      <input type="email" value={editBrandForm.contact_email ?? ''} onChange={(e) => setEditBrandForm({ ...editBrandForm, contact_email: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
                    </label>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                    <label style={{ flex: '1 1 140px' }}>
                      <span style={labelStyle}>Category</span>
                      <input type="text" value={editBrandForm.category ?? ''} onChange={(e) => setEditBrandForm({ ...editBrandForm, category: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
                    </label>
                    <label style={{ flex: '1 1 180px' }}>
                      <span style={labelStyle}>Website</span>
                      <input type="url" value={editBrandForm.website ?? ''} onChange={(e) => setEditBrandForm({ ...editBrandForm, website: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
                    </label>
                    <label style={{ flex: '1 1 180px' }}>
                      <span style={labelStyle}>Logo URL</span>
                      <input type="url" value={editBrandForm.logo_url ?? ''} onChange={(e) => setEditBrandForm({ ...editBrandForm, logo_url: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
                    </label>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label>
                      <span style={labelStyle}>Description</span>
                      <textarea rows={2} value={editBrandForm.description ?? ''} onChange={(e) => setEditBrandForm({ ...editBrandForm, description: e.target.value })} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={saveEditBrand} style={btnPrimary}>Save</button>
                    <button onClick={() => { setEditingBrandId(null); setEditBrandForm({}); }} style={btnSecondary}>Cancel</button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={brand.id}
                style={{
                  background: colors.surfaceHover,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                  opacity: brand.is_active ? 1 : 0.5,
                }}
              >
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: colors.text }}>
                    {brand.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: colors.textMuted, marginTop: 2 }}>
                    {brand.slug}
                    {brand.category && (
                      <span style={{ marginLeft: 10, padding: '1px 8px', borderRadius: 9999, background: colors.accent, color: '#fff', fontSize: '0.68rem', fontWeight: 600 }}>
                        {brand.category}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ minWidth: 120, fontSize: '0.82rem', color: colors.textMuted }}>
                  {brand.contact_email}
                </div>

                <div style={{ minWidth: 60, textAlign: 'center', fontSize: '0.78rem', color: colors.textMuted }}>
                  {brand.product_count} product{brand.product_count !== 1 ? 's' : ''}
                </div>

                {/* Active toggle */}
                <button
                  onClick={() => toggleBrandActive(brand)}
                  style={{
                    position: 'relative',
                    width: 44,
                    height: 24,
                    borderRadius: 9999,
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                    background: brand.is_active ? colors.success : '#555',
                    transition: 'background 200ms',
                  }}
                  aria-label={`Toggle ${brand.name} active status`}
                >
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    left: brand.is_active ? 22 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    transition: 'left 200ms',
                  }} />
                </button>

                <button
                  onClick={() => startEditBrand(brand)}
                  style={btnSecondary}
                >
                  Edit
                </button>
              </div>
            );
          })}
          {brands.length === 0 && (
            <p style={{ color: colors.textMuted, fontSize: '0.85rem', textAlign: 'center', padding: 24 }}>
              No brands found. Add one to get started.
            </p>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 2: Product Catalog                                   */}
      {/* ============================================================ */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: colors.text, marginBottom: 4 }}>
              Product Catalog
            </h2>
            <p style={{ color: colors.textMuted, fontSize: '0.82rem', margin: 0 }}>
              Select a brand to view and manage its products.
            </p>
          </div>
          {selectedBrandId && (
            <button
              onClick={() => setShowProductForm((v) => !v)}
              style={btnPrimary}
            >
              {showProductForm ? 'Cancel' : 'Add Product'}
            </button>
          )}
        </div>

        {/* Brand selector */}
        <div style={{ marginBottom: 20 }}>
          <label>
            <span style={labelStyle}>Brand</span>
            <select
              value={selectedBrandId}
              onChange={(e) => { setSelectedBrandId(e.target.value); setShowProductForm(false); }}
              style={{ ...inputStyle, width: 300, maxWidth: '100%' }}
            >
              <option value="">-- Select a brand --</option>
              {brands.filter((b) => b.is_active).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Add Product Form */}
        {showProductForm && selectedBrandId && (
          <div style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: colors.text, marginBottom: 16 }}>
              New Product
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <label style={{ flex: '1 1 200px' }}>
                <span style={labelStyle}>Name *</span>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value, slug: generateSlug(e.target.value) })}
                  style={{ ...inputStyle, width: '100%' }}
                  placeholder="Product name"
                />
              </label>
              <label style={{ flex: '0 0 160px' }}>
                <span style={labelStyle}>Slug</span>
                <input
                  type="text"
                  value={productForm.slug}
                  onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                  style={{ ...inputStyle, width: '100%', fontFamily: 'monospace', fontSize: '0.82rem' }}
                  placeholder="auto-generated"
                />
              </label>
              <label style={{ flex: '1 1 140px' }}>
                <span style={labelStyle}>Category *</span>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                  placeholder="e.g. Edibles, Flower"
                />
              </label>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <label style={{ flex: '0 0 130px' }}>
                <span style={labelStyle}>Price (cents) *</span>
                <input
                  type="number"
                  min="0"
                  value={productForm.unit_price_cents}
                  onChange={(e) => setProductForm({ ...productForm, unit_price_cents: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                  placeholder="e.g. 1500"
                />
              </label>
              <label style={{ flex: '0 0 110px' }}>
                <span style={labelStyle}>Unit Type</span>
                <input
                  type="text"
                  value={productForm.unit_type}
                  onChange={(e) => setProductForm({ ...productForm, unit_type: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                  placeholder="unit"
                />
              </label>
              <label style={{ flex: '0 0 110px' }}>
                <span style={labelStyle}>Min Order Qty</span>
                <input
                  type="number"
                  min="1"
                  value={productForm.min_order_qty}
                  onChange={(e) => setProductForm({ ...productForm, min_order_qty: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </label>
              <label style={{ flex: '1 1 200px' }}>
                <span style={labelStyle}>Image URL</span>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                  placeholder="https://..."
                />
              </label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>
                <span style={labelStyle}>Description</span>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
                />
              </label>
            </div>
            <button
              onClick={createProduct}
              disabled={productSaving || !productForm.name.trim() || !productForm.category.trim() || !productForm.unit_price_cents}
              style={{ ...btnPrimary, opacity: productSaving || !productForm.name.trim() || !productForm.category.trim() || !productForm.unit_price_cents ? 0.5 : 1 }}
            >
              {productSaving ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        )}

        {/* Products table */}
        {selectedBrandId && (
          productsLoading ? (
            <p style={{ color: colors.textMuted, fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>
              Loading products...
            </p>
          ) : products.length === 0 ? (
            <p style={{ color: colors.textMuted, fontSize: '0.85rem', textAlign: 'center', padding: 24 }}>
              No products for this brand yet. Add one above.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                    {['Name', 'Category', 'Price', 'Unit', 'Min Qty', 'Available'].map((h) => (
                      <th key={h} style={{ textAlign: h === 'Price' || h === 'Min Qty' ? 'right' : 'left', padding: '10px 14px', color: colors.textMuted, fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: colors.text }}>
                        {product.name}
                      </td>
                      <td style={{ padding: '12px 14px', color: colors.textMuted }}>
                        {product.category}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <input
                          type="number"
                          min="0"
                          defaultValue={product.unit_price_cents}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val !== product.unit_price_cents) {
                              saveInlineEdit(product.id, 'unit_price_cents', e.target.value);
                            }
                          }}
                          style={{ ...inputStyle, width: 90, textAlign: 'right', fontWeight: 700, display: 'inline-block', fontFamily: 'monospace' }}
                          aria-label={`Price in cents for ${product.name}`}
                        />
                        <div style={{ fontSize: '0.68rem', color: colors.textMuted, marginTop: 2 }}>
                          ${formatCents(product.unit_price_cents)}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: colors.textMuted }}>
                        {product.unit_type}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <input
                          type="number"
                          min="1"
                          defaultValue={product.min_order_qty}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val !== product.min_order_qty && val >= 1) {
                              saveInlineEdit(product.id, 'min_order_qty', e.target.value);
                            }
                          }}
                          style={{ ...inputStyle, width: 70, textAlign: 'right', fontWeight: 600, display: 'inline-block' }}
                          aria-label={`Minimum order quantity for ${product.name}`}
                        />
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleProductAvailable(product)}
                          style={{
                            position: 'relative',
                            width: 44,
                            height: 24,
                            borderRadius: 9999,
                            border: 'none',
                            cursor: 'pointer',
                            background: product.is_available ? colors.success : '#555',
                            transition: 'background 200ms',
                          }}
                          aria-label={`Toggle availability for ${product.name}`}
                        >
                          <span style={{
                            position: 'absolute',
                            top: 2,
                            left: product.is_available ? 22 : 2,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#fff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            transition: 'left 200ms',
                          }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {!selectedBrandId && (
          <p style={{ color: colors.textMuted, fontSize: '0.85rem', textAlign: 'center', padding: 24 }}>
            Select a brand above to view its product catalog.
          </p>
        )}
      </section>

      {/* ============================================================ */}
      {/*  SECTION 3: Admin Configuration                               */}
      {/* ============================================================ */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: colors.text, marginBottom: 4 }}>
          Admin Configuration
        </h2>
        <p style={{ color: colors.textMuted, fontSize: '0.82rem', marginBottom: 20 }}>
          System settings and feature flags.
        </p>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Admin Email
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: colors.text }}>
            {adminEmail || '\u2014'}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 20 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Feature Flags
          </div>

          {([
            { key: 'email_notifications' as const, label: 'Email Notifications', desc: 'Send email alerts for new orders and account activity' },
            { key: 'auto_approve_dispensaries' as const, label: 'Auto-Approve Dispensaries', desc: 'Automatically approve new dispensary account applications' },
            { key: 'maintenance_mode' as const, label: 'Maintenance Mode', desc: 'Show maintenance page to non-admin visitors' },
          ]).map((flag) => (
            <div key={flag.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${colors.border}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: colors.text }}>{flag.label}</div>
                <div style={{ fontSize: '0.78rem', color: colors.textMuted, marginTop: 2 }}>{flag.desc}</div>
              </div>
              <button
                onClick={() => toggleFeature(flag.key)}
                style={{
                  position: 'relative',
                  width: 44,
                  height: 24,
                  borderRadius: 9999,
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  background: features[flag.key] ? colors.accent : '#555',
                  transition: 'background 200ms',
                }}
                aria-label={`Toggle ${flag.label}`}
              >
                <span style={{
                  position: 'absolute',
                  top: 2,
                  left: features[flag.key] ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'left 200ms',
                }} />
              </button>
            </div>
          ))}

          <p style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: 12, fontStyle: 'italic' }}>
            Feature flags are stored locally. Server-side persistence available via /api/admin/settings/config.
          </p>
        </div>
      </section>
    </div>
  );
}
