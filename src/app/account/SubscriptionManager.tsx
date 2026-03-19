'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Pause, Play, XCircle, Package, Box, Calendar, Loader2, CreditCard, AlertTriangle } from 'lucide-react';
import { frequencyLabel, type Subscription, type SubscriptionFrequency } from '@/lib/subscriptions';

type Props = {
  email: string;
};

export default function SubscriptionManager({ email }: Props) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch(`/api/subscriptions?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load subscriptions');
      setSubscriptions(data.subscriptions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  async function handleAction(subId: string, action: 'pause' | 'resume' | 'cancel') {
    setActionLoading(subId);
    setError(null);
    try {
      const statusMap = { pause: 'paused', resume: 'active', cancel: 'cancelled' } as const;
      const res = await fetch(`/api/subscriptions/${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, status: statusMap[action] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Action failed');
      // Refresh list
      await fetchSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleFrequencyChange(subId: string, frequency: SubscriptionFrequency) {
    setActionLoading(subId);
    setError(null);
    try {
      const res = await fetch(`/api/subscriptions/${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, frequency }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update frequency');
      await fetchSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdateCard(subId: string) {
    setActionLoading(subId);
    setError(null);
    try {
      const res = await fetch(`/api/subscriptions/${subId}/update-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create checkout link');
      // Redirect to Square checkout to capture new card
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment method');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 20,
          padding: '28px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Loader2 size={16} style={{ animation: 'e8-spin 0.7s linear infinite' }} color="var(--color-warm-gray)" />
        <span style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray)' }}>Loading subscriptions...</span>
      </div>
    );
  }

  // Don't render section if no subscriptions exist
  if (subscriptions.length === 0) {
    return null;
  }

  const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: '#EDF7F0', color: 'var(--color-purple-muted)', label: 'Active' },
    paused: { bg: '#FFF8EC', color: 'var(--color-gold)', label: 'Paused' },
    cancelled: { bg: '#FEF2F2', color: '#dc2626', label: 'Cancelled' },
  };

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 20,
        padding: '28px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <RefreshCw size={16} color="var(--color-purple-muted)" />
        <p
          className="label-caps"
          style={{ color: 'var(--color-warm-gray)', fontSize: '0.6rem', margin: 0 }}
        >
          My Subscriptions
        </p>
      </div>

      {error && (
        <div
          style={{
            fontSize: '0.78rem',
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {subscriptions.map((sub) => {
          const style = statusStyles[sub.status] ?? statusStyles.active;
          const items = (sub.items ?? []) as Array<{
            slug: string;
            name: string;
            quantity: number;
            purchaseUnit: string;
          }>;
          const isLoading = actionLoading === sub.id;
          const nextDate = sub.next_renewal_at
            ? new Date(sub.next_renewal_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'N/A';

          return (
            <div
              key={sub.id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 14,
                padding: '18px 20px',
                backgroundColor: '#fafaf9',
              }}
            >
              {/* Header row: status + frequency */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    backgroundColor: style.bg,
                    color: style.color,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 4,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {style.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={12} color="var(--color-warm-gray)" />
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-warm-gray)' }}>
                    {frequencyLabel(sub.frequency as SubscriptionFrequency)}
                  </span>
                </div>
              </div>

              {/* Items list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.82rem',
                      color: 'var(--color-charcoal)',
                    }}
                  >
                    {item.purchaseUnit === 'case' ? (
                      <Package size={13} color="var(--color-royal)" />
                    ) : (
                      <Box size={13} color="var(--color-warm-gray)" />
                    )}
                    <span style={{ fontWeight: 600 }}>
                      {item.quantity}x {item.name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-warm-gray)' }}>
                      ({item.purchaseUnit})
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment failed warning */}
              {sub.payment_failed_at && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.75rem',
                    color: '#dc2626',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 12,
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>Payment failed. Please update your payment method to resume.</span>
                </div>
              )}

              {/* Card on file */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  fontSize: '0.75rem',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CreditCard size={13} color="var(--color-warm-gray)" />
                  <span style={{ color: 'var(--color-warm-gray)' }}>
                    {sub.card_last4
                      ? <>Card on file: <strong style={{ color: 'var(--color-charcoal)', fontFamily: 'monospace' }}>**** {sub.card_last4}</strong></>
                      : 'No card on file'}
                  </span>
                </div>
                {sub.status !== 'cancelled' && (
                  <button
                    onClick={() => handleUpdateCard(sub.id)}
                    disabled={isLoading}
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: 'var(--color-primary, #1a56db)',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--color-border)',
                      borderRadius: 5,
                      padding: '3px 9px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontFamily: "'Barlow', Arial, sans-serif",
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  >
                    {isLoading ? 'Loading...' : sub.card_last4 ? 'Update Card' : 'Add Card'}
                  </button>
                )}
              </div>

              {/* Next renewal + discount */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                  fontSize: '0.75rem',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                <span style={{ color: 'var(--color-warm-gray)' }}>
                  Next renewal: <strong style={{ color: 'var(--color-charcoal)' }}>{nextDate}</strong>
                </span>
                <span
                  style={{
                    backgroundColor: '#EDF7F0',
                    color: 'var(--color-purple-muted)',
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    padding: '2px 7px',
                    borderRadius: 4,
                    letterSpacing: '0.05em',
                  }}
                >
                  {Math.round(sub.discount_pct)}% OFF
                </span>
              </div>

              {/* Frequency selector (only for active/paused) */}
              {sub.status !== 'cancelled' && (
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: 'var(--color-warm-gray)',
                      marginBottom: 4,
                      display: 'block',
                    }}
                  >
                    Delivery Frequency
                  </label>
                  <select
                    value={sub.frequency}
                    onChange={(e) =>
                      handleFrequencyChange(sub.id, e.target.value as SubscriptionFrequency)
                    }
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 7,
                      fontSize: '0.8rem',
                      fontFamily: "'Barlow', Arial, sans-serif",
                      backgroundColor: '#fff',
                      color: 'var(--color-charcoal)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <option value="biweekly">Every 2 Weeks</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Every 3 Months</option>
                  </select>
                </div>
              )}

              {/* Action buttons */}
              {sub.status !== 'cancelled' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {sub.status === 'active' && (
                    <button
                      onClick={() => handleAction(sub.id, 'pause')}
                      disabled={isLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--color-gold)',
                        backgroundColor: '#FFF8EC',
                        border: '1px solid rgba(200,146,42,0.3)',
                        borderRadius: 6,
                        padding: '6px 12px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontFamily: "'Barlow', Arial, sans-serif",
                        opacity: isLoading ? 0.6 : 1,
                      }}
                    >
                      {isLoading ? (
                        <Loader2 size={11} style={{ animation: 'e8-spin 0.7s linear infinite' }} />
                      ) : (
                        <Pause size={11} />
                      )}
                      Pause
                    </button>
                  )}
                  {sub.status === 'paused' && (
                    <button
                      onClick={() => handleAction(sub.id, 'resume')}
                      disabled={isLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--color-purple-muted)',
                        backgroundColor: '#EDF7F0',
                        border: '1px solid rgba(74,124,89,0.2)',
                        borderRadius: 6,
                        padding: '6px 12px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontFamily: "'Barlow', Arial, sans-serif",
                        opacity: isLoading ? 0.6 : 1,
                      }}
                    >
                      {isLoading ? (
                        <Loader2 size={11} style={{ animation: 'e8-spin 0.7s linear infinite' }} />
                      ) : (
                        <Play size={11} />
                      )}
                      Resume
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this subscription? This cannot be undone.')) {
                        handleAction(sub.id, 'cancel');
                      }
                    }}
                    disabled={isLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#dc2626',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #fecaca',
                      borderRadius: 6,
                      padding: '6px 12px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontFamily: "'Barlow', Arial, sans-serif",
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  >
                    {isLoading ? (
                      <Loader2 size={11} style={{ animation: 'e8-spin 0.7s linear infinite' }} />
                    ) : (
                      <XCircle size={11} />
                    )}
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
