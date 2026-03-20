import React from 'react';

/* ── Local theme tokens ── */
export const CARD_BG = 'rgba(255,255,255,0.04)';
export const BORDER = 'rgba(200,162,60,0.12)';
export const GOLD = '#C8A23C';
export const TEXT_PRIMARY = '#ffffff';
export const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';
export const TEXT_MUTED = 'rgba(255,255,255,0.35)';

export const STATUS_COLORS: Record<string, string> = {
  pending: '#EAB308',
  running: '#3B82F6',
  complete: '#22C55E',
  failed: '#EF4444',
};

/* ── Types ── */
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  unit_price_cents: number;
  unit_type: string;
}

export interface PersonaReaction {
  persona_name: string;
  sentiment: number;
  would_buy: boolean;
  reaction: string;
  objections: string[];
  praise: string[];
}

export interface TestResult {
  id: string;
  title: string;
  stimulus_type: string;
  persona_count: number;
  status: 'pending' | 'running' | 'complete' | 'failed';
  avg_sentiment: number | null;
  would_buy_pct: number | null;
  top_objections: string[];
  top_praise: string[];
  reactions: PersonaReaction[];
  created_at: string;
}

export type StimulusType = 'text' | 'url' | 'product' | 'brand';

/* ── Helpers ── */
export function adminFetch(path: string, opts: RequestInit = {}) {
  const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN || '';
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  return fetch(path, { ...opts, headers }).then((r) => r.json());
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function maskKey(key: string): string {
  if (key.length <= 8) return key;
  return '****' + key.slice(-8);
}

/* ── Shared styles ── */
export const cardStyle: React.CSSProperties = {
  background: CARD_BG,
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  padding: 24,
  marginBottom: 32,
};

export const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.15rem',
  fontWeight: 700,
  color: TEXT_PRIMARY,
  marginBottom: 16,
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: `1px solid ${BORDER}`,
  background: 'rgba(255,255,255,0.04)',
  color: TEXT_PRIMARY,
  fontSize: '0.85rem',
  outline: 'none',
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239B8AAE' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
};

export const btnPrimary: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: 10,
  fontSize: '0.85rem',
  fontWeight: 700,
  border: 'none',
  background: GOLD,
  color: '#0F0520',
  cursor: 'pointer',
  transition: 'opacity 150ms',
};

export const btnSecondary: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 8,
  fontSize: '0.8rem',
  fontWeight: 600,
  border: `1px solid ${BORDER}`,
  background: 'transparent',
  color: TEXT_SECONDARY,
  cursor: 'pointer',
  transition: 'all 150ms',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: TEXT_SECONDARY,
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

export const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left' as const,
  fontSize: '0.72rem',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: TEXT_MUTED,
  whiteSpace: 'nowrap' as const,
};

export const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  color: TEXT_SECONDARY,
  fontSize: '0.84rem',
};

export const errorBoxStyle: React.CSSProperties = {
  background: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.25)',
  borderRadius: 10,
  padding: '10px 14px',
  marginBottom: 16,
  color: '#f87171',
  fontSize: '0.85rem',
};
