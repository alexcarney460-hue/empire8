'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, Trash2, RefreshCw, ShoppingBag, ArrowRight, AlertCircle, Truck, Loader2, Package, Box, Mail } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getSupabase } from '@/lib/supabase';
import { getTierName, casesToNextTier, getCasePriceForQuantity, getProductBySlug } from '@/lib/products';
import { formatPrice } from '@/lib/pricing';
import { trackEvent, fbTrackInitiateCheckout } from '@/lib/analytics';

type ShippingRate = {
  id: string;
  carrier: string;
  service: string;
  price: number;
  estimatedDays: number | null;
  description: string;
};

export default function CartDrawer() {
  const { items, removeItem, updateQty, total, count, totalCaseCount, isOpen, closeCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Email verification state: null = not logged in (guest), true = verified, false = unverified
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setEmailVerified(!!data.session.user.email_confirmed_at);
      } else {
        setEmailVerified(null);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setEmailVerified(!!session.user.email_confirmed_at);
      } else {
        setEmailVerified(null);
      }
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  // Block checkout for logged-in users with unverified email (guests can still checkout)
  const emailBlocked = emailVerified === false;

  // Shipping state
  const [zip, setZip] = useState('');
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [ratesFetched, setRatesFetched] = useState(false);

  const hasAutoship = items.some((i) => i.plan === 'autoship');
  const hasOneTime  = items.some((i) => i.plan === 'one-time');
  const mixedPlans  = hasAutoship && hasOneTime;

  // Tier info for case items
  const currentTier = totalCaseCount > 0 ? getTierName(totalCaseCount) : null;
  const nextTier = totalCaseCount > 0 ? casesToNextTier(totalCaseCount) : null;

  // Recalculate total with dynamic tier pricing for case items
  const adjustedTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.purchaseUnit === 'case') {
        const product = getProductBySlug(item.id);
        if (product) {
          const tierPrice = getCasePriceForQuantity(product, totalCaseCount);
          return sum + tierPrice * item.quantity;
        }
      }
      return sum + item.price * item.quantity;
    }, 0);
  }, [items, totalCaseCount]);

  // Reset shipping when cart changes
  useEffect(() => {
    setShippingRates([]);
    setSelectedRate(null);
    setRatesFetched(false);
    setRatesError(null);
  }, [items.length, adjustedTotal]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeCart]);

  const fetchRates = useCallback(async () => {
    if (!zip || zip.length < 5) {
      setRatesError('Enter a valid 5-digit zip code');
      return;
    }
    setRatesLoading(true);
    setRatesError(null);
    setShippingRates([]);
    setSelectedRate(null);
    try {
      const res = await fetch('/api/shipping/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip,
          items: items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to get rates');
      if (!data.rates || data.rates.length === 0) {
        setRatesError('No shipping options available for this zip code');
      } else {
        setShippingRates(data.rates);
        setSelectedRate(data.rates[0]);
      }
      setRatesFetched(true);
    } catch (err) {
      setRatesError(err instanceof Error ? err.message : 'Failed to get shipping rates');
    } finally {
      setRatesLoading(false);
    }
  }, [zip, items]);

  async function handleCheckout() {
    if (mixedPlans || !selectedRate || emailBlocked) return;

    // Analytics: begin_checkout (GA4) + InitiateCheckout (Meta Pixel)
    trackEvent('begin_checkout', { currency: 'USD', value: adjustedTotal });
    fbTrackInitiateCheckout(adjustedTotal, count);

    setLoading(true);
    setError(null);
    try {
      // Build items with tier-adjusted prices for checkout
      const checkoutItems = items.map((item) => {
        if (item.purchaseUnit === 'case') {
          const product = getProductBySlug(item.id);
          if (product) {
            const tierPrice = getCasePriceForQuantity(product, totalCaseCount);
            return { ...item, price: tierPrice };
          }
        }
        return item;
      });

      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checkoutItems,
          shipping: {
            carrier: selectedRate.carrier,
            service: selectedRate.service,
            price: selectedRate.price,
            estimatedDays: selectedRate.estimatedDays,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  const orderTotal = selectedRate ? adjustedTotal + selectedRate.price : adjustedTotal;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={closeCart}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 300,
            animation: 'fadeIn 200ms ease',
          }}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 460,
          backgroundColor: '#fff',
          zIndex: 400,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 340ms cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isOpen ? '-8px 0 48px rgba(0,0,0,0.12)' : 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingBag size={18} color="var(--color-royal)" />
            <span className="font-heading" style={{ fontSize: '1rem', color: 'var(--color-charcoal)' }}>
              Your Cart
            </span>
            {count > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--color-gold)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {count}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-warm-gray)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 6,
              transition: 'background-color 150ms ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px' }}>
              <ShoppingBag size={40} color="var(--color-border)" style={{ margin: '0 auto 16px' }} />
              <p className="font-heading" style={{ color: 'var(--color-charcoal)', marginBottom: 8 }}>Your cart is empty</p>
              <p style={{ color: 'var(--color-warm-gray)', fontSize: '0.875rem', marginBottom: 24 }}>
                Add products from the catalog to get started.
              </p>
              <Link
                href="/catalog"
                onClick={closeCart}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'var(--color-royal)',
                  color: '#fff',
                  padding: '11px 24px',
                  borderRadius: 8,
                  fontFamily: "'Barlow', Arial, sans-serif",
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                Browse Catalog <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {items.map((item) => {
                // Calculate tier-adjusted price for case items
                const effectivePrice = (() => {
                  if (item.purchaseUnit === 'case') {
                    const product = getProductBySlug(item.id);
                    if (product) return getCasePriceForQuantity(product, totalCaseCount);
                  }
                  return item.price;
                })();

                return (
                  <div
                    key={`${item.id}-${item.plan}-${item.purchaseUnit ?? 'default'}`}
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: '16px 24px',
                      borderBottom: '1px solid var(--color-border)',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        width: 68,
                        height: 68,
                        borderRadius: 10,
                        overflow: 'hidden',
                        backgroundColor: 'var(--color-purple-light)',
                        flexShrink: 0,
                        position: 'relative',
                      }}
                    >
                      <Image src={item.img} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="68px" />
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 4, lineHeight: 1.3 }}>
                        {item.name}
                      </div>

                      {/* Badges row: plan + purchase unit */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                        {item.plan === 'autoship' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              backgroundColor: '#EDF7F0',
                              color: 'var(--color-purple-muted)',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 4,
                              letterSpacing: '0.05em',
                            }}
                          >
                            <RefreshCw size={9} /> Subscribe & Save
                          </span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: 'var(--color-purple-light)',
                              color: 'var(--color-warm-gray)',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: 4,
                              letterSpacing: '0.05em',
                            }}
                          >
                            One-Time
                          </span>
                        )}

                        {/* Purchase unit badge */}
                        {item.purchaseUnit && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              backgroundColor: item.purchaseUnit === 'case' ? '#F0F4FF' : 'var(--color-purple-light)',
                              color: item.purchaseUnit === 'case' ? '#4A6FA5' : 'var(--color-warm-gray)',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: 4,
                              letterSpacing: '0.05em',
                            }}
                          >
                            {item.purchaseUnit === 'case' ? <Package size={9} /> : <Box size={9} />}
                            {item.purchaseUnit === 'case' ? 'Case (10 boxes)' : 'Box (100 units)'}
                          </span>
                        )}
                      </div>

                      {/* Unit price display */}
                      {item.purchaseUnit === 'case' && effectivePrice !== item.price && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-purple-muted)', fontWeight: 600, marginBottom: 6 }}>
                          {formatPrice(effectivePrice)}/case ({currentTier} tier)
                        </div>
                      )}

                      {/* Qty + price row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--color-border)', borderRadius: 7, overflow: 'hidden' }}>
                          <button
                            onClick={() => updateQty(item.id, item.plan, item.quantity - 1, item.purchaseUnit)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px 10px', color: 'var(--color-charcoal)', display: 'flex', alignItems: 'center' }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-charcoal)', minWidth: 24, textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, item.plan, item.quantity + 1, item.purchaseUnit)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px 10px', color: 'var(--color-charcoal)', display: 'flex', alignItems: 'center' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                            ${(effectivePrice * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeItem(item.id, item.plan, item.purchaseUnit)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-warm-gray)', display: 'flex', padding: 4 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              padding: '20px 24px',
              flexShrink: 0,
              backgroundColor: '#fff',
              maxHeight: '55vh',
              overflowY: 'auto',
            }}
          >
            {/* Mixed plan warning */}
            {mixedPlans && (
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  backgroundColor: '#FFF8EC',
                  border: '1px solid rgba(200,146,42,0.3)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 16,
                }}
              >
                <AlertCircle size={15} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.78rem', color: 'var(--color-charcoal)', lineHeight: 1.5, margin: 0 }}>
                  One-time and subscription items must be purchased separately. Please remove one type to continue.
                </p>
              </div>
            )}

            {/* Autoship notice */}
            {hasAutoship && !mixedPlans && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  backgroundColor: '#EDF7F0',
                  borderRadius: 8,
                  padding: '9px 12px',
                  marginBottom: 14,
                }}
              >
                <RefreshCw size={13} color="var(--color-purple-muted)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-purple-muted)', fontWeight: 600 }}>
                  Monthly delivery · Cancel anytime in your account
                </span>
              </div>
            )}

            {/* Tier banner for case buyers */}
            {totalCaseCount > 0 && currentTier && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: currentTier === 'Distributor' ? '#F5F0FF' : currentTier === 'Wholesale' ? '#F0F8FF' : 'var(--color-purple-light)',
                  borderRadius: 8,
                  padding: '9px 12px',
                  marginBottom: 14,
                  border: `1px solid ${currentTier === 'Distributor' ? 'rgba(106,90,205,0.2)' : currentTier === 'Wholesale' ? 'rgba(70,130,180,0.2)' : 'transparent'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={13} color={currentTier === 'Distributor' ? '#6A5ACD' : currentTier === 'Wholesale' ? '#4682B4' : 'var(--color-royal)'} />
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: currentTier === 'Distributor' ? '#6A5ACD' : currentTier === 'Wholesale' ? '#4682B4' : 'var(--color-royal)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {currentTier} Pricing
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-warm-gray)' }}>
                  {totalCaseCount} case{totalCaseCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Next tier nudge */}
            {nextTier && totalCaseCount > 0 && (
              <div
                style={{
                  backgroundColor: '#FFFBEB',
                  border: '1px solid rgba(200,146,42,0.2)',
                  borderRadius: 8,
                  padding: '9px 12px',
                  marginBottom: 14,
                  fontSize: '0.75rem',
                  color: 'var(--color-charcoal)',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                Add {nextTier.needed} more case{nextTier.needed !== 1 ? 's' : ''} to unlock{' '}
                <span style={{ color: nextTier.tierName === 'Distributor' ? '#6A5ACD' : '#4682B4', fontWeight: 700 }}>
                  {nextTier.tierName}
                </span>{' '}
                pricing!
              </div>
            )}

            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ color: 'var(--color-warm-gray)', fontSize: '0.82rem' }}>
                {hasAutoship ? 'Monthly subtotal' : 'Subtotal'}
              </span>
              <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                ${adjustedTotal.toFixed(2)}
              </span>
            </div>

            {/* Shipping zip + rate selection */}
            <div style={{
              backgroundColor: 'var(--color-purple-light)',
              borderRadius: 10,
              padding: '14px 14px',
              marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Truck size={14} color="var(--color-charcoal)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                  Shipping
                </span>
              </div>

              {/* Zip input row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: ratesFetched ? 10 : 0 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="Zip code"
                  value={zip}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setZip(v);
                    if (ratesFetched) {
                      setRatesFetched(false);
                      setShippingRates([]);
                      setSelectedRate(null);
                    }
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && zip.length === 5) fetchRates(); }}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 7,
                    fontSize: '0.85rem',
                    fontFamily: "'Barlow', Arial, sans-serif",
                    outline: 'none',
                    backgroundColor: '#fff',
                  }}
                />
                <button
                  onClick={fetchRates}
                  disabled={ratesLoading || zip.length < 5}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: 'var(--color-royal)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 7,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: "'Barlow', Arial, sans-serif",
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    cursor: ratesLoading || zip.length < 5 ? 'not-allowed' : 'pointer',
                    opacity: ratesLoading || zip.length < 5 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ratesLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : 'Get Rates'}
                </button>
              </div>

              {/* Rates error */}
              {ratesError && (
                <p style={{ color: 'var(--color-alert-red)', fontSize: '0.75rem', margin: '6px 0 0' }}>{ratesError}</p>
              )}

              {/* Rate options */}
              {shippingRates.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {shippingRates.slice(0, 6).map((rate) => (
                    <label
                      key={rate.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        backgroundColor: selectedRate?.id === rate.id ? '#EDF7F0' : '#fff',
                        border: selectedRate?.id === rate.id ? '2px solid var(--color-royal)' : '1px solid var(--color-border)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="shipping-rate"
                        checked={selectedRate?.id === rate.id}
                        onChange={() => setSelectedRate(rate)}
                        style={{ accentColor: 'var(--color-royal)', margin: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                          {rate.carrier} {rate.service}
                        </div>
                        {rate.estimatedDays && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-warm-gray)' }}>
                            Est. {rate.estimatedDays} business day{rate.estimatedDays !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      <span className="font-mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-charcoal)', whiteSpace: 'nowrap' }}>
                        ${rate.price.toFixed(2)}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Prompt if no rates fetched yet */}
              {!ratesFetched && !ratesLoading && !ratesError && (
                <p style={{ color: 'var(--color-warm-gray)', fontSize: '0.72rem', margin: '8px 0 0', textAlign: 'center' }}>
                  Enter your zip code to see shipping options
                </p>
              )}
            </div>

            {/* Shipping line (if selected) */}
            {selectedRate && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: 'var(--color-warm-gray)', fontSize: '0.82rem' }}>
                    Shipping ({selectedRate.carrier} {selectedRate.service})
                  </span>
                  <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                    ${selectedRate.price.toFixed(2)}
                  </span>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: 10 }} />

                {/* Order total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ color: 'var(--color-charcoal)', fontSize: '0.9rem', fontWeight: 700 }}>
                    Estimated Total
                  </span>
                  <span className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                    ${orderTotal.toFixed(2)}
                  </span>
                </div>
              </>
            )}

            {/* Email verification warning */}
            {emailBlocked && (
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  backgroundColor: '#FFF8EC',
                  border: '1px solid rgba(200,146,42,0.3)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 14,
                }}
              >
                <Mail size={15} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.78rem', color: 'var(--color-charcoal)', lineHeight: 1.5, margin: 0 }}>
                  Please verify your email before checking out.{' '}
                  <Link
                    href="/account"
                    onClick={closeCart}
                    style={{ color: 'var(--color-royal)', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Go to Account
                  </Link>{' '}
                  to resend the verification email.
                </p>
              </div>
            )}

            {error && (
              <p style={{ color: 'var(--color-alert-red)', fontSize: '0.78rem', marginBottom: 10 }}>{error}</p>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading || mixedPlans || !selectedRate || emailBlocked}
              className="e8-btn-royal"
              style={{
                width: '100%',
                backgroundColor: (mixedPlans || !selectedRate || emailBlocked) ? 'var(--color-border)' : 'var(--color-royal)',
                color: (mixedPlans || !selectedRate || emailBlocked) ? 'var(--color-warm-gray)' : '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '15px 24px',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: (mixedPlans || !selectedRate || emailBlocked) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading ? 'Redirecting...' : emailBlocked ? 'Verify Email to Checkout' : !selectedRate ? 'Select Shipping to Continue' : 'Proceed to Checkout'}
              {!loading && selectedRate && !emailBlocked && <ArrowRight size={16} />}
            </button>

            <button
              onClick={clearCart}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-warm-gray)',
                fontSize: '0.75rem',
                marginTop: 10,
                display: 'block',
                width: '100%',
                textAlign: 'center',
                textDecoration: 'underline',
              }}
            >
              Clear cart
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
