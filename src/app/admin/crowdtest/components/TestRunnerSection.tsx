'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Brand,
  Product,
  StimulusType,
  adminFetch,
  cardStyle,
  sectionTitleStyle,
  inputStyle,
  selectStyle,
  btnPrimary,
  labelStyle,
  errorBoxStyle,
  TEXT_SECONDARY,
} from './shared';

export function TestRunnerSection({ onTestCreated }: { onTestCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [stimulusType, setStimulusType] = useState<StimulusType>('text');
  const [stimulusContent, setStimulusContent] = useState('');
  const [audience, setAudience] = useState('general');
  const [customAudience, setCustomAudience] = useState('');
  const [personaCount, setPersonaCount] = useState(50);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBrandSlug, setSelectedBrandSlug] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch brands on mount
  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json())
      .then((res) => {
        if (res.success || res.data) {
          setBrands(res.data ?? []);
        }
      })
      .catch(() => { /* brands optional */ });
  }, []);

  // Fetch products when brand selected
  useEffect(() => {
    if ((stimulusType === 'product' || stimulusType === 'brand') && selectedBrandSlug) {
      setLoadingProducts(true);
      fetch(`/api/brands/${selectedBrandSlug}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success || res.data) {
            setProducts(res.data?.products ?? []);
            if (stimulusType === 'brand' && res.data?.brand) {
              const b = res.data.brand;
              setStimulusContent(
                `Brand: ${b.name}\nCategory: ${b.category}\nDescription: ${b.description ?? 'N/A'}`
              );
            }
          }
          setLoadingProducts(false);
        })
        .catch(() => setLoadingProducts(false));
    } else {
      setProducts([]);
    }
  }, [stimulusType, selectedBrandSlug]);

  // Auto-fill stimulus when product selected
  useEffect(() => {
    if (stimulusType === 'product' && selectedProductId) {
      const p = products.find((pr) => pr.id === selectedProductId);
      if (p) {
        const brand = brands.find((b) => b.slug === selectedBrandSlug);
        const priceStr = p.unit_price_cents
          ? `$${(p.unit_price_cents / 100).toFixed(2)}/${p.unit_type || 'unit'}`
          : 'Price not set';
        setStimulusContent(
          `Product: ${p.name}\nBrand: ${brand?.name ?? 'Unknown'}\nCategory: ${p.category}\nPrice: ${priceStr}\nDescription: ${p.description ?? 'N/A'}`
        );
      }
    }
  }, [stimulusType, selectedProductId, products, brands, selectedBrandSlug]);

  // Reset selections when stimulus type changes
  useEffect(() => {
    setSelectedBrandSlug('');
    setSelectedProductId('');
    setStimulusContent('');
    setProducts([]);
  }, [stimulusType]);

  function cleanup() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  async function handleRun() {
    if (!title.trim() || !stimulusContent.trim()) return;
    setRunning(true);
    setError('');
    setProgress('Submitting test...');

    try {
      const body = {
        title: title.trim(),
        stimulus_type: stimulusType,
        stimulus_content: stimulusContent.trim(),
        audience: audience === 'custom' ? customAudience.trim() : audience,
        persona_count: personaCount,
      };

      const res = await adminFetch('/api/admin/crowdtest/tests', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (res.ok || res.success) {
        const testId = res.data?.id;
        if (testId) {
          setProgress('Test queued. Polling for results...');
          pollingRef.current = setInterval(async () => {
            try {
              const poll = await adminFetch(`/api/admin/crowdtest/tests?id=${testId}`);
              const status = poll.data?.status;
              if (status === 'running') {
                setProgress('Test running...');
              } else if (status === 'complete') {
                setProgress(null);
                setRunning(false);
                cleanup();
                onTestCreated();
                setTitle('');
                setStimulusContent('');
              } else if (status === 'failed') {
                setProgress(null);
                setError('Test failed. Check logs for details.');
                setRunning(false);
                cleanup();
                onTestCreated();
              }
            } catch {
              /* continue polling */
            }
          }, 3000);
        } else {
          setProgress(null);
          setRunning(false);
          onTestCreated();
          setTitle('');
          setStimulusContent('');
        }
      } else {
        setError(res.error || 'Failed to start test');
        setProgress(null);
        setRunning(false);
      }
    } catch {
      setError('Network error starting test.');
      setProgress(null);
      setRunning(false);
    }
  }

  useEffect(() => cleanup, []);

  const audienceOptions = [
    { value: 'general', label: 'General Population' },
    { value: 'cannabis_consumers', label: 'Cannabis Consumers' },
    { value: 'dispensary_owners', label: 'Dispensary Owners' },
    { value: 'health_conscious', label: 'Health-Conscious Adults' },
    { value: 'young_adults', label: 'Young Adults (21-35)' },
    { value: 'custom', label: 'Custom...' },
  ];

  const personaOptions = [20, 50, 100, 250, 500];

  return (
    <div style={cardStyle}>
      <h2 style={sectionTitleStyle}>New Test</h2>

      {error && <div style={errorBoxStyle}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Title */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q1 Brand Perception Test"
            style={inputStyle}
          />
        </div>

        {/* Stimulus Type */}
        <div>
          <label style={labelStyle}>Stimulus Type</label>
          <select
            value={stimulusType}
            onChange={(e) => setStimulusType(e.target.value as StimulusType)}
            style={selectStyle}
          >
            <option value="text">Text</option>
            <option value="url">URL</option>
            <option value="product">Product</option>
            <option value="brand">Brand</option>
          </select>
        </div>

        {/* Audience */}
        <div>
          <label style={labelStyle}>Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            style={selectStyle}
          >
            {audienceOptions.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        {/* Brand selector */}
        {(stimulusType === 'product' || stimulusType === 'brand') && (
          <div>
            <label style={labelStyle}>
              {stimulusType === 'brand' ? 'Select Brand' : 'Select Brand (for products)'}
            </label>
            <select
              value={selectedBrandSlug}
              onChange={(e) => {
                setSelectedBrandSlug(e.target.value);
                setSelectedProductId('');
              }}
              style={selectStyle}
            >
              <option value="">-- Choose a brand --</option>
              {brands.map((b) => (
                <option key={b.slug} value={b.slug}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Product selector */}
        {stimulusType === 'product' && selectedBrandSlug && (
          <div>
            <label style={labelStyle}>Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={selectStyle}
              disabled={loadingProducts}
            >
              <option value="">
                {loadingProducts ? 'Loading products...' : '-- Choose a product --'}
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Persona Count */}
        <div>
          <label style={labelStyle}>Persona Count</label>
          <select
            value={personaCount}
            onChange={(e) => setPersonaCount(Number(e.target.value))}
            style={selectStyle}
          >
            {personaOptions.map((n) => (
              <option key={n} value={n}>{n} personas</option>
            ))}
          </select>
        </div>

        {/* Custom Audience */}
        {audience === 'custom' && (
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Custom Audience Description</label>
            <textarea
              value={customAudience}
              onChange={(e) => setCustomAudience(e.target.value)}
              placeholder="Describe the target audience demographic, interests, behaviors..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        )}

        {/* Stimulus Content */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Stimulus Content</label>
          <textarea
            value={stimulusContent}
            onChange={(e) => setStimulusContent(e.target.value)}
            placeholder={
              stimulusType === 'url'
                ? 'Enter the URL to test...'
                : stimulusType === 'product' || stimulusType === 'brand'
                  ? 'Auto-filled when you select above, or edit manually...'
                  : 'Enter the text, concept, or idea to test with the audience...'
            }
            rows={5}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Progress indicator */}
      {progress && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}>
          <div style={{
            width: 14, height: 14,
            border: '2px solid #3B82F6',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'e8spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: '0.85rem', color: '#60A5FA' }}>{progress}</span>
        </div>
      )}

      <button
        style={{
          ...btnPrimary,
          opacity: running || !title.trim() || !stimulusContent.trim() ? 0.5 : 1,
        }}
        onClick={handleRun}
        disabled={running || !title.trim() || !stimulusContent.trim()}
      >
        {running ? 'Running...' : 'Run Test'}
      </button>

      <style>{`
        @keyframes e8spin { to { transform: rotate(360deg); } }
        select option { background: #1A0E2E; color: #fff; }
      `}</style>
    </div>
  );
}
