'use client';

import { STATUS_COLORS, TEXT_MUTED } from './shared';

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? TEXT_MUTED;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const bgAlpha = `rgba(${r},${g},${b},0.12)`;
  const borderAlpha = `rgba(${r},${g},${b},0.25)`;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 9999,
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: bgAlpha,
        color,
        border: `1px solid ${borderAlpha}`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
