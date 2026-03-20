'use client';

import { useMemo } from 'react';
import { Check } from 'lucide-react';
import type { OrderStatus } from '@/lib/orders';

/* ── Types ─────────────────────────────────────────────────────────── */

interface StatusStep {
  key: OrderStatus;
  label: string;
  date: string | null;
}

interface OrderTrackingProps {
  currentStatus: OrderStatus;
  statusHistory?: ReadonlyArray<{ status: OrderStatus; date: string }>;
}

/* ── Constants ─────────────────────────────────────────────────────── */

const STATUS_ORDER: ReadonlyArray<OrderStatus> = [
  'submitted',
  'processing',
  'shipped',
  'delivered',
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  submitted: 'Submitted',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

const COLORS = {
  bg: '#0F0520',
  gold: '#C8A23C',
  goldLight: '#E8D48B',
  purple: '#4A0E78',
  purpleMuted: '#7B5A9E',
  textPrimary: '#F8F6F2',
  textMuted: '#9A9590',
  lineInactive: '#2D0A4E',
  dotInactive: '#3D1A5E',
};

/* ── Helpers ───────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function OrderTracking({
  currentStatus,
  statusHistory = [],
}: OrderTrackingProps) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  const steps: ReadonlyArray<StatusStep> = useMemo(() => {
    return STATUS_ORDER.map((key) => {
      const historyEntry = statusHistory.find((h) => h.status === key);
      return {
        key,
        label: STATUS_LABELS[key],
        date: historyEntry?.date ?? null,
      };
    });
  }, [statusHistory]);

  return (
    <div
      style={{
        backgroundColor: COLORS.bg,
        borderRadius: 14,
        padding: '28px 24px',
        border: `1px solid ${COLORS.lineInactive}`,
      }}
      role="region"
      aria-label="Order status timeline"
    >
      <h3
        className="font-heading"
        style={{
          fontSize: '0.85rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: COLORS.textMuted,
          marginBottom: 28,
        }}
      >
        Order Status
      </h3>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        {/* Connecting line (behind dots) */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            height: 2,
            backgroundColor: COLORS.lineInactive,
            zIndex: 0,
          }}
          aria-hidden="true"
        />

        {/* Progress fill */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            width:
              currentIdx <= 0
                ? 0
                : `calc(${(currentIdx / (STATUS_ORDER.length - 1)) * 100}% - 32px)`,
            height: 2,
            background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.goldLight})`,
            zIndex: 1,
            transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          aria-hidden="true"
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isUpcoming = idx > currentIdx;

          return (
            <div
              key={step.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                position: 'relative',
                zIndex: 2,
              }}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Dot */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCompleted
                    ? COLORS.gold
                    : isCurrent
                      ? COLORS.bg
                      : COLORS.dotInactive,
                  border: isCurrent
                    ? `3px solid ${COLORS.gold}`
                    : isCompleted
                      ? 'none'
                      : `2px solid ${COLORS.lineInactive}`,
                  boxShadow: isCurrent
                    ? `0 0 0 4px rgba(200, 162, 60, 0.25), 0 0 16px rgba(200, 162, 60, 0.3)`
                    : 'none',
                  transition: 'all 400ms ease',
                }}
              >
                {isCompleted && (
                  <Check size={16} color={COLORS.bg} strokeWidth={3} />
                )}
                {isCurrent && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: COLORS.gold,
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
                )}
                {isUpcoming && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: COLORS.lineInactive,
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className="font-heading"
                style={{
                  marginTop: 10,
                  fontSize: '0.78rem',
                  fontWeight: isCurrent ? 700 : 600,
                  color: isCompleted || isCurrent
                    ? COLORS.gold
                    : COLORS.textMuted,
                  textAlign: 'center',
                  letterSpacing: '0.03em',
                  transition: 'color 300ms ease',
                }}
              >
                {step.label}
              </span>

              {/* Date */}
              {step.date && (
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: COLORS.textMuted,
                      display: 'block',
                      lineHeight: 1.3,
                    }}
                  >
                    {formatDate(step.date)}
                  </span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      color: COLORS.purpleMuted,
                      display: 'block',
                      lineHeight: 1.3,
                    }}
                  >
                    {formatTime(step.date)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
