'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RefreshCw, ShoppingCart, ArrowRight, CheckCircle, Package, Box } from 'lucide-react';
import { useCart, type PurchasePlan, type PurchaseUnit } from '@/context/CartContext';
import { AUTOSHIP_DISCOUNT } from '@/lib/square';
import { formatPrice, roundMoney } from '@/lib/pricing';
import type { Product } from '@/lib/products';
import { hasCasePricing, getCasePriceForQuantity, getTierName, casesToNextTier } from '@/lib/products';
import { trackAddToCart, fbTrackAddToCart } from '@/lib/analytics';

type Props = {
  id: string;
  name: string;
  price: number;       // retail price
  img: string;
  unit: string;
  product?: Product;   // full product for case pricing info
};

export default function AddToCartPanel({ id, name, price, img, unit, product }: Props) {
  const { addItem } = useCart();
  const [plan, setPlan] = useState<PurchasePlan>('one-time');
  const AUTOSHIP_ENABLED = true;
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const isGlove = product != null && hasCasePricing(product);
  const [purchaseUnit, setPurchaseUnit] = useState<PurchaseUnit>(isGlove ? 'case' : 'box');

  // Derive the correct unit price
  const baseUnitPrice = (() => {
    if (!isGlove || !product) return price;
    if (purchaseUnit === 'box') return product.boxPrice ?? price;
    // Case pricing: use tier-based price from quantity
    return getCasePriceForQuantity(product, qty);
  })();

  const autoshipPrice = roundMoney(baseUnitPrice * (1 - AUTOSHIP_DISCOUNT));
  const displayPrice = plan === 'autoship' ? autoshipPrice : baseUnitPrice;
  const savings = plan === 'autoship' ? roundMoney(baseUnitPrice * qty - autoshipPrice * qty) : 0;

  // Tier info for case purchases
  const currentTier = purchaseUnit === 'case' ? getTierName(qty) : null;
  const nextTierInfo = purchaseUnit === 'case' ? casesToNextTier(qty) : null;

  function handleAdd() {
    addItem(
      {
        id,
        name,
        price: displayPrice,
        plan,
        img,
        unit: purchaseUnit === 'case' ? '/ case' : unit,
        purchaseUnit: isGlove ? purchaseUnit : undefined,
      },
      qty,
    );

    // Analytics: add_to_cart (GA4 + Meta Pixel)
    const itemData = { id, name, price: displayPrice, category: product?.category };
    const totalValue = roundMoney(displayPrice * qty);
    trackAddToCart(itemData, qty, totalValue);
    fbTrackAddToCart(itemData, qty, totalValue);

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div>
      {/* Box / Case toggle for glove products */}
      {isGlove && product && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              border: '1.5px solid var(--color-border)',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => { setPurchaseUnit('box'); setQty(1); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                background: purchaseUnit === 'box' ? 'var(--color-bg)' : '#fff',
                border: 'none',
                borderRight: '1px solid var(--color-border)',
                cursor: 'pointer',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: purchaseUnit === 'box' ? 700 : 500,
                fontSize: '0.82rem',
                color: purchaseUnit === 'box' ? 'var(--color-royal)' : 'var(--color-warm-gray)',
                transition: 'all 150ms ease',
              }}
            >
              <Box size={14} />
              Buy by Box
            </button>
            <button
              onClick={() => { setPurchaseUnit('case'); setQty(1); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                background: purchaseUnit === 'case' ? '#EDF7F0' : '#fff',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: purchaseUnit === 'case' ? 700 : 500,
                fontSize: '0.82rem',
                color: purchaseUnit === 'case' ? 'var(--color-purple-muted)' : 'var(--color-warm-gray)',
                transition: 'all 150ms ease',
              }}
            >
              <Package size={14} />
              Buy by Case
            </button>
          </div>

          {/* Unit info */}
          <div style={{ fontSize: '0.72rem', color: 'var(--color-warm-gray)', marginTop: 6, textAlign: 'center' }}>
            {purchaseUnit === 'box'
              ? `1 box = ${100} units`
              : `1 case = ${product.caseBoxCount ?? 10} boxes (${product.caseGloveCount ?? 1000} units)`
            }
          </div>

          {/* Case savings callout */}
          {purchaseUnit === 'box' && product.boxPrice != null && product.casePrice != null && (
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                backgroundColor: '#EDF7F0',
                borderRadius: 8,
                fontSize: '0.75rem',
                color: 'var(--color-purple-muted)',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              Save ${roundMoney(product.boxPrice * (product.caseBoxCount ?? 10) - product.casePrice).toFixed(2)}/case when buying by the case
            </div>
          )}

          {/* Tier pricing breakdown for cases */}
          {purchaseUnit === 'case' && (
            <div
              style={{
                marginTop: 10,
                padding: '10px 14px',
                backgroundColor: 'var(--color-purple-light)',
                borderRadius: 8,
                display: 'flex',
                gap: 0,
                flexDirection: 'column',
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Volume Pricing
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: '1-29 cases', price: product.casePrice!, tier: 'Retail' },
                  { label: '30-119 cases', price: product.wholesalePrice!, tier: 'Wholesale' },
                  { label: '120+ cases', price: product.distributorPrice!, tier: 'Distributor' },
                ].map(({ label, price: tierPrice, tier }) => (
                  <div
                    key={tier}
                    style={{
                      flex: 1,
                      padding: '8px 6px',
                      backgroundColor: currentTier === tier ? '#fff' : 'transparent',
                      border: currentTier === tier ? '1.5px solid var(--color-royal)' : '1px solid transparent',
                      borderRadius: 6,
                      textAlign: 'center',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <div
                      className="font-mono"
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: currentTier === tier ? 'var(--color-royal)' : 'var(--color-charcoal)',
                      }}
                    >
                      {formatPrice(tierPrice)}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--color-warm-gray)', marginTop: 2 }}>
                      {label}
                    </div>
                    {currentTier === tier && (
                      <div style={{
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        color: 'var(--color-purple-muted)',
                        marginTop: 3,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        Your Tier
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Next tier nudge */}
              {nextTierInfo && (
                <div style={{
                  marginTop: 8,
                  fontSize: '0.72rem',
                  color: 'var(--color-royal)',
                  fontWeight: 600,
                  textAlign: 'center',
                }}>
                  Add {nextTierInfo.needed} more case{nextTierInfo.needed !== 1 ? 's' : ''} to unlock {nextTierInfo.tierName} pricing
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Plan selector — autoship hidden until recurring billing is implemented */}
      {AUTOSHIP_ENABLED && (
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {/* One-time option */}
          <button
            onClick={() => setPlan('one-time')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 18px',
              background: plan === 'one-time' ? 'var(--color-bg)' : '#fff',
              border: 'none',
              borderBottom: '1px solid var(--color-border)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 150ms ease',
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: `2px solid ${plan === 'one-time' ? 'var(--color-royal)' : 'var(--color-border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'border-color 150ms ease',
              }}
            >
              {plan === 'one-time' && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-royal)' }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-charcoal)' }}>
                One-Time Purchase
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-warm-gray)', marginTop: 2 }}>
                Order as needed, no commitment
              </div>
            </div>
            <span className="font-mono" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-charcoal)' }}>
              {formatPrice(baseUnitPrice)}
            </span>
          </button>

          {/* Subscribe & Save option */}
          <button
            onClick={() => setPlan('autoship')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 18px',
              background: plan === 'autoship' ? '#EDF7F0' : '#fff',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 150ms ease',
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: `2px solid ${plan === 'autoship' ? 'var(--color-purple-muted)' : 'var(--color-border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'border-color 150ms ease',
              }}
            >
              {plan === 'autoship' && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-purple-muted)' }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-charcoal)' }}>
                  Subscribe & Save
                </span>
                <span
                  style={{
                    backgroundColor: 'var(--color-purple-muted)',
                    color: '#fff',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 4,
                    letterSpacing: '0.06em',
                  }}
                >
                  10% OFF
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-purple-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                <RefreshCw size={10} />
                Monthly delivery · Cancel anytime
              </div>
            </div>
            <span className="font-mono" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-purple-muted)' }}>
              {formatPrice(autoshipPrice)}
            </span>
          </button>
        </div>

        {plan === 'autoship' && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-purple-muted)', marginTop: 8, fontWeight: 600 }}>
            You save {formatPrice(roundMoney(baseUnitPrice - autoshipPrice))} per {purchaseUnit} vs. one-time pricing
          </p>
        )}
      </div>
      )}

      {/* Quantity + price row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1.5px solid var(--color-border)', borderRadius: 9 }}>
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '10px 14px',
              color: 'var(--color-charcoal)',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            -
          </button>
          <span
            className="font-mono"
            style={{
              minWidth: 32,
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'var(--color-charcoal)',
            }}
          >
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => q + 1)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '10px 14px',
              color: 'var(--color-charcoal)',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            +
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-charcoal)', lineHeight: 1 }}>
            {formatPrice(roundMoney(displayPrice * qty))}
          </div>
          {qty > 1 && (
            <div style={{ fontSize: '0.72rem', color: 'var(--color-warm-gray)', marginTop: 3 }}>
              {formatPrice(displayPrice)} x {qty} {purchaseUnit === 'case' ? 'cases' : isGlove ? 'boxes' : 'units'}
            </div>
          )}
          {savings > 0 && (
            <div style={{ fontSize: '0.72rem', color: 'var(--color-purple-muted)', fontWeight: 600, marginTop: 2 }}>
              Saving {formatPrice(savings)} vs. one-time
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          onClick={handleAdd}
          className="e8-btn-royal"
          style={{
            flex: 1,
            backgroundColor: added ? 'var(--color-purple-muted)' : 'var(--color-royal)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '15px 20px',
            fontFamily: "'Barlow', Arial, sans-serif",
            fontWeight: 700,
            fontSize: '0.88rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'background-color 250ms ease, transform 220ms cubic-bezier(0.16,1,0.3,1), box-shadow 220ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {added ? (
            <><CheckCircle size={15} /> Added!</>
          ) : (
            <><ShoppingCart size={15} /> Add {qty} {purchaseUnit === 'case' ? (qty === 1 ? 'Case' : 'Cases') : (qty === 1 ? (isGlove ? 'Box' : 'Unit') : (isGlove ? 'Boxes' : 'Units'))}</>
          )}
        </button>
        <Link
          href="/contact"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-charcoal)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 10,
            padding: '15px 18px',
            fontFamily: "'Barlow', Arial, sans-serif",
            fontWeight: 600,
            fontSize: '0.85rem',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            transition: 'border-color 150ms ease',
          }}
        >
          Quote
        </Link>
      </div>

      {/* Wholesale upgrade prompt */}
      <div
        style={{
          backgroundColor: 'var(--color-purple-light)',
          borderRadius: 10,
          padding: '13px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-royal)', marginBottom: 2 }}>
            Buying 30+ cases?
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-purple-muted)' }}>
            Wholesale accounts save $10/case on every order
          </div>
        </div>
        <Link
          href="/wholesale"
          style={{
            color: 'var(--color-royal)',
            fontFamily: "'Barlow', Arial, sans-serif",
            fontWeight: 700,
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
          }}
        >
          Apply <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}
