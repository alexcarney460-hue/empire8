'use client';

import { useEffect, useState, useCallback } from 'react';
import { Printer, RefreshCw, CheckCircle, Square, CheckSquare, Filter, Package } from 'lucide-react';

interface QueueOrder {
  id: number;
  email: string;
  status: string;
  total: number;
  shipping_name: string | null;
  shipping_address_line1: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_zip: string | null;
  label_url: string | null;
  tracking_number: string | null;
  shipping_carrier: string | null;
  shipping_service: string | null;
  printed_at: string | null;
  created_at: string;
}

const token = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_TOKEN ?? '';
const authHeaders: Record<string, string> = token
  ? { Authorization: `Bearer ${token}` }
  : {};

function fmtDate(iso: string) {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function PrintBatchPage() {
  const [orders, setOrders] = useState<QueueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [marking, setMarking] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [dateFrom, setDateFrom] = useState(daysAgoISO(30));
  const [dateTo, setDateTo] = useState(todayISO());
  const [showPrinted, setShowPrinted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: '100',
      include_printed: showPrinted ? 'true' : 'false',
    });
    if (dateFrom) params.set('from', new Date(dateFrom).toISOString());
    if (dateTo) params.set('to', new Date(dateTo + 'T23:59:59').toISOString());

    try {
      const res = await fetch(`/api/admin/shipping/print-queue?${params}`, { headers: authHeaders });
      const json = await res.json();
      if (json.ok) {
        setOrders(json.data ?? []);
        setSelected(new Set());
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [dateFrom, dateTo, showPrinted]);

  useEffect(() => { load(); }, [load]);

  const unprintedOrders = orders.filter((o) => !o.printed_at);
  const printedOrders = orders.filter((o) => o.printed_at);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const unprinted = unprintedOrders.map((o) => o.id);
    const allSelected = unprinted.every((id) => selected.has(id));
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unprinted));
    }
  };

  const markAsPrinted = async (ids: number[]) => {
    if (ids.length === 0) return;
    setMarking(true);
    try {
      await fetch('/api/admin/shipping/print-queue', {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: ids, printed: true }),
      });
      await load();
    } catch { /* ignore */ }
    setMarking(false);
  };

  const markAsUnprinted = async (ids: number[]) => {
    if (ids.length === 0) return;
    setMarking(true);
    try {
      await fetch('/api/admin/shipping/print-queue', {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: ids, printed: false }),
      });
      await load();
    } catch { /* ignore */ }
    setMarking(false);
  };

  const printAll = async () => {
    const toPrint = unprintedOrders.filter(
      (o) => o.label_url && (selected.size === 0 || selected.has(o.id)),
    );
    if (toPrint.length === 0) return;

    setPrinting(true);

    // Open each label in a new tab for printing
    for (const order of toPrint) {
      window.open(`/admin/shipping/print/${order.id}`, `print_${order.id}`);
      // Stagger slightly to avoid browser blocking popups
      await new Promise((r) => setTimeout(r, 500));
    }

    // Mark all as printed
    await markAsPrinted(toPrint.map((o) => o.id));
    setPrinting(false);
  };

  const btnBase: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: '0.82rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid var(--color-border, #e4e1db)',
    backgroundColor: '#fff',
    color: 'var(--color-charcoal, #1c1c1c)',
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    backgroundColor: 'var(--color-royal, #4A0E78)',
    color: '#fff',
    border: 'none',
    fontWeight: 700,
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{
            fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-charcoal, #1c1c1c)',
            margin: 0, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Printer size={22} /> Print Queue
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray, #9a9590)', margin: '4px 0 0' }}>
            {unprintedOrders.length} label{unprintedOrders.length !== 1 ? 's' : ''} awaiting print
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/admin/shipping" style={{ ...btnBase, textDecoration: 'none' }}>
            <Package size={13} /> Packing Dashboard
          </a>
          <button onClick={load} style={btnBase} disabled={loading}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
        padding: '12px 16px', background: '#f8faf8', borderRadius: 10,
        border: '1px solid var(--color-border, #e4e1db)',
        flexWrap: 'wrap',
      }}>
        <Filter size={14} style={{ color: 'var(--color-warm-gray)' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600 }}>
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: '5px 10px', borderRadius: 6, border: '1px solid #ddd',
              fontSize: '0.82rem', fontFamily: 'inherit',
            }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600 }}>
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              padding: '5px 10px', borderRadius: 6, border: '1px solid #ddd',
              fontSize: '0.82rem', fontFamily: 'inherit',
            }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showPrinted}
            onChange={(e) => setShowPrinted(e.target.checked)}
            style={{ accentColor: '#4A0E78' }}
          />
          Show printed
        </label>
      </div>

      {/* Action bar */}
      {unprintedOrders.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, padding: '10px 16px',
          background: '#fff', borderRadius: 10,
          border: '1px solid var(--color-border, #e4e1db)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={selectAll} style={{ ...btnBase, padding: '6px 12px' }}>
              {unprintedOrders.every((o) => selected.has(o.id)) ? (
                <><CheckSquare size={14} /> Deselect All</>
              ) : (
                <><Square size={14} /> Select All</>
              )}
            </button>
            {selected.size > 0 && (
              <span style={{ fontSize: '0.82rem', color: 'var(--color-warm-gray)' }}>
                {selected.size} selected
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {selected.size > 0 && (
              <button
                onClick={() => markAsPrinted(Array.from(selected))}
                disabled={marking}
                style={btnBase}
              >
                <CheckCircle size={13} /> Mark Printed
              </button>
            )}
            <button
              onClick={printAll}
              disabled={printing || unprintedOrders.length === 0}
              style={{
                ...btnPrimary,
                opacity: printing ? 0.7 : 1,
              }}
            >
              <Printer size={14} />
              {selected.size > 0
                ? `Print Selected (${selected.size})`
                : `Print All (${unprintedOrders.length})`
              }
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-warm-gray)' }}>
          Loading...
        </div>
      )}

      {/* Empty state */}
      {!loading && unprintedOrders.length === 0 && !showPrinted && (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-warm-gray)' }}>
          <CheckCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>All labels printed!</p>
          <p style={{ fontSize: '0.85rem' }}>No unprinted labels in this date range.</p>
        </div>
      )}

      {/* Unprinted orders */}
      {!loading && unprintedOrders.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-charcoal)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Awaiting Print ({unprintedOrders.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unprintedOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                isSelected={selected.has(order.id)}
                onToggle={() => toggleSelect(order.id)}
                onMarkPrinted={() => markAsPrinted([order.id])}
                marking={marking}
              />
            ))}
          </div>
        </div>
      )}

      {/* Printed orders (if shown) */}
      {!loading && showPrinted && printedOrders.length > 0 && (
        <div>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-warm-gray)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Already Printed ({printedOrders.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {printedOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                isSelected={false}
                onToggle={() => {}}
                onMarkPrinted={() => markAsUnprinted([order.id])}
                marking={marking}
                isPrinted
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  isSelected,
  onToggle,
  onMarkPrinted,
  marking,
  isPrinted = false,
}: {
  order: QueueOrder;
  isSelected: boolean;
  onToggle: () => void;
  onMarkPrinted: () => void;
  marking: boolean;
  isPrinted?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: isPrinted ? '#fafaf8' : '#fff',
        border: `1px solid ${isSelected ? '#4A0E78' : 'var(--color-border, #e4e1db)'}`,
        borderRadius: 10,
        opacity: isPrinted ? 0.7 : 1,
        transition: 'border-color 150ms',
      }}
    >
      {/* Checkbox */}
      {!isPrinted && (
        <button
          onClick={onToggle}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: isSelected ? '#4A0E78' : '#ccc',
            flexShrink: 0,
          }}
        >
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>
      )}

      {/* Order info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--color-charcoal)' }}>
            #{String(order.id).slice(-8)}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-warm-gray)' }}>
            {fmtDate(order.created_at)}
          </span>
          {order.shipping_carrier && (
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, color: '#4A0E78',
              background: '#f0fdf4', padding: '2px 8px', borderRadius: 4,
            }}>
              {order.shipping_carrier}
            </span>
          )}
          {isPrinted && (
            <span style={{
              fontSize: '0.72rem', fontWeight: 600, color: '#6b7280',
              background: '#f3f4f6', padding: '2px 8px', borderRadius: 4,
            }}>
              Printed {fmtDate(order.printed_at!)}
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.82rem', color: '#555', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {order.shipping_name || order.email} &mdash; {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
        </div>
      </div>

      {/* Total */}
      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-charcoal)', flexShrink: 0 }}>
        ${order.total?.toFixed(2)}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {order.label_url ? (
          <a
            href={`/admin/shipping/print/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '6px 12px', borderRadius: 6,
              backgroundColor: '#4A0E78', color: '#fff',
              fontWeight: 700, fontSize: '0.75rem', textDecoration: 'none',
            }}
          >
            <Printer size={12} /> Print
          </a>
        ) : (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 6,
            backgroundColor: '#fef3c7', color: '#92400e',
            fontWeight: 700, fontSize: '0.75rem',
          }}>
            Needs Label
          </span>
        )}
        <button
          onClick={onMarkPrinted}
          disabled={marking}
          style={{
            padding: '6px 10px', borderRadius: 6,
            border: '1px solid var(--color-border, #e4e1db)',
            backgroundColor: '#fff', cursor: 'pointer',
            fontSize: '0.75rem', fontWeight: 600,
            color: isPrinted ? '#dc2626' : '#4A0E78',
          }}
        >
          {isPrinted ? 'Unmark' : <><CheckCircle size={12} /> Done</>}
        </button>
      </div>
    </div>
  );
}
