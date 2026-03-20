'use client';

import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

interface UploadRecord {
  readonly id: string;
  readonly filename: string;
  readonly rows_processed: number;
  readonly rows_added: number;
  readonly rows_updated: number;
  readonly errors_count: number;
  readonly status: string;
  readonly created_at: string;
}

interface UploadResult {
  readonly ok: boolean;
  readonly rows_processed?: number;
  readonly rows_added?: number;
  readonly rows_updated?: number;
  readonly errors?: readonly string[];
  readonly error?: string;
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
  successBg: 'rgba(34,197,94,0.12)',
  successText: '#4ade80',
  errorBg: 'rgba(239,68,68,0.12)',
  errorText: '#f87171',
  warningBg: 'rgba(200,162,60,0.12)',
} as const;

const CSV_TEMPLATE = `name,category,description,unit_price_cents,unit_type,min_order_qty
"Example Product","Flower","Premium indoor flower",1500,"unit",10
"Another Product","Edibles","Gummy bears 100mg",2500,"pack",5`;

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  success: { bg: COLORS.successBg, color: COLORS.successText, label: 'Success' },
  partial: { bg: COLORS.warningBg, color: COLORS.gold, label: 'Partial' },
  failed: { bg: COLORS.errorBg, color: COLORS.errorText, label: 'Failed' },
};

/* ── Helpers ───────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusBadge(status: string) {
  return STATUS_CONFIG[status] ?? { bg: 'rgba(255,255,255,0.08)', color: COLORS.textSecondary, label: status };
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function BrandMenuUploadPage() {
  const [uploads, setUploads] = useState<readonly UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load upload history
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/brand-dashboard/menu-upload');
        if (cancelled) return;

        if (res.ok) {
          const json = await res.json();
          if (json.ok) setUploads(json.data ?? []);
        }
      } catch {
        // Non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const handleUpload = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setError('');
    setResult(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/brand-dashboard/menu-upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json.error || 'Upload failed.');
      } else {
        setResult(json);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Reload upload history
        const historyRes = await fetch('/api/brand-dashboard/menu-upload');
        if (historyRes.ok) {
          const historyJson = await historyRes.json();
          if (historyJson.ok) setUploads(historyJson.data ?? []);
        }
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [selectedFile]);

  const downloadTemplate = useCallback(() => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-menu-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
            fontWeight: 700,
            color: COLORS.textPrimary,
            margin: '0 0 6px 0',
          }}
        >
          Menu Upload
        </h1>
        <p style={{ fontSize: '0.88rem', color: COLORS.textSecondary, margin: 0 }}>
          Upload a CSV file to bulk add or update your product catalog.
        </p>
      </div>

      {/* Upload form */}
      <div
        style={{
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 16,
          padding: '28px 24px',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <p
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.gold,
              margin: 0,
              fontFamily: "'Barlow', Arial, sans-serif",
            }}
          >
            Upload CSV
          </p>
          <button
            onClick={downloadTemplate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 9999,
              padding: '6px 16px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: COLORS.gold,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Download size={12} />
            Download Template
          </button>
        </div>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Drop zone */}
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 24px',
              borderRadius: 12,
              border: `2px dashed ${COLORS.cardBorder}`,
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
          >
            <Upload size={28} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
            <p style={{ fontSize: '0.88rem', color: COLORS.textSecondary, margin: '0 0 4px' }}>
              {selectedFile ? selectedFile.name : 'Click to select a CSV file'}
            </p>
            <p style={{ fontSize: '0.75rem', color: COLORS.textMuted, margin: 0 }}>
              Required columns: name, category, unit_price_cents, unit_type, min_order_qty
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                setSelectedFile(e.target.files?.[0] ?? null);
                setResult(null);
                setError('');
              }}
              style={{ display: 'none' }}
            />
          </label>

          {/* Error message */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.82rem',
                color: COLORS.errorText,
                backgroundColor: COLORS.errorBg,
                borderRadius: 10,
                padding: '10px 14px',
              }}
            >
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Success result */}
          {result && result.ok && (
            <div
              style={{
                backgroundColor: COLORS.successBg,
                borderRadius: 10,
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <CheckCircle size={16} color={COLORS.successText} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.successText }}>
                  Upload complete
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: COLORS.textSecondary, margin: 0 }}>
                {result.rows_processed} rows processed: {result.rows_added} added, {result.rows_updated} updated.
                {(result.errors?.length ?? 0) > 0 && ` ${result.errors?.length} errors.`}
              </p>
              {(result.errors?.length ?? 0) > 0 && (
                <div style={{ marginTop: 8, fontSize: '0.78rem', color: COLORS.errorText }}>
                  {result.errors?.map((err, i) => (
                    <p key={i} style={{ margin: '2px 0' }}>{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedFile || uploading}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: !selectedFile || uploading ? COLORS.textMuted : COLORS.gold,
              color: '#1A0633',
              border: 'none',
              borderRadius: 9999,
              padding: '12px 28px',
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.78rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
            }}
          >
            <Upload size={14} />
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </form>
      </div>

      {/* Upload history */}
      <div>
        <h2
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: COLORS.textPrimary,
            margin: '0 0 16px 0',
          }}
        >
          Upload History
        </h2>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: `3px solid ${COLORS.cardBorder}`,
                borderTopColor: COLORS.gold,
                animation: 'e8-spin 0.7s linear infinite',
              }}
            />
          </div>
        ) : uploads.length === 0 ? (
          <div
            style={{
              backgroundColor: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              padding: '40px 24px',
              textAlign: 'center',
            }}
          >
            <FileText size={28} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
            <p style={{ color: COLORS.textSecondary, fontSize: '0.88rem', margin: 0 }}>
              No uploads yet.
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
            {uploads.map((upload, idx) => {
              const badge = getStatusBadge(upload.status);
              return (
                <div
                  key={upload.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 20px',
                    borderBottom: idx < uploads.length - 1 ? `1px solid ${COLORS.cardBorder}` : 'none',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <FileText size={16} color={COLORS.textMuted} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.textPrimary }}>
                      {upload.filename}
                    </span>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        backgroundColor: badge.bg,
                        color: badge.color,
                        borderRadius: 9999,
                        padding: '3px 10px',
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: '0.78rem', color: COLORS.textSecondary }}>
                      {upload.rows_added} added, {upload.rows_updated} updated
                    </span>
                    <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                      {formatDate(upload.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
