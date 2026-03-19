'use client';

import { ArrowRight } from 'lucide-react';
import FormSubmit from '@/components/FormSubmit';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1px solid var(--color-border, #E2E8F0)',
  fontSize: '0.88rem',
  color: 'var(--color-charcoal, #0F172A)',
  background: '#FAFAF9',
  outline: 'none',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: '0.68rem',
  color: 'var(--color-charcoal)',
};

const PRODUCT_CATEGORIES = [
  'Flower',
  'Pre-Rolls',
  'Vapes/Cartridges',
  'Edibles',
  'Concentrates',
  'Tinctures',
  'Beverages',
  'Other',
];

export default function DistributionForm() {
  return (
    <FormSubmit
      formType="distribution"
      fields={[
        'company_name',
        'contact_name',
        'email',
        'phone',
        'license_number',
        'license_type',
        'street_address',
        'city',
        'state',
        'zip',
        'product_categories',
        'monthly_volume',
        'referral_source',
        'message',
      ]}
      successMessage="Dispensary partner application submitted!"
    >
      {({ values, onChange, status }) => (
        <>
          {/* Company Name */}
          <div>
            <label className="label-caps" style={labelStyle}>Company Name *</label>
            <input type="text" required placeholder="Legal business name" value={values.company_name} onChange={(e) => onChange('company_name', e.target.value)} style={inputStyle} />
          </div>

          {/* Contact Name */}
          <div>
            <label className="label-caps" style={labelStyle}>Contact Name *</label>
            <input type="text" required placeholder="Full name" value={values.contact_name} onChange={(e) => onChange('contact_name', e.target.value)} style={inputStyle} />
          </div>

          {/* Email */}
          <div>
            <label className="label-caps" style={labelStyle}>Email *</label>
            <input type="email" required placeholder="orders@yourdispensary.com" value={values.email} onChange={(e) => onChange('email', e.target.value)} style={inputStyle} />
          </div>

          {/* Phone */}
          <div>
            <label className="label-caps" style={labelStyle}>Phone *</label>
            <input type="tel" required placeholder="(555) 000-0000" value={values.phone} onChange={(e) => onChange('phone', e.target.value)} style={inputStyle} />
          </div>

          {/* NY Cannabis License Number */}
          <div>
            <label className="label-caps" style={labelStyle}>NY Cannabis License Number *</label>
            <input type="text" required placeholder="OCM license number" value={values.license_number} onChange={(e) => onChange('license_number', e.target.value)} style={inputStyle} />
          </div>

          {/* License Type */}
          <div>
            <label className="label-caps" style={labelStyle}>License Type *</label>
            <select required value={values.license_type} onChange={(e) => onChange('license_type', e.target.value)} style={inputStyle}>
              <option value="">Select license type</option>
              <option value="CAURD Dispensary">CAURD Dispensary</option>
              <option value="Adult-Use Retail Dispensary">Adult-Use Retail Dispensary</option>
              <option value="Registered Organization">Registered Organization</option>
            </select>
          </div>

          {/* Business Address */}
          <div>
            <label className="label-caps" style={labelStyle}>Street Address *</label>
            <input type="text" required placeholder="123 Main St" value={values.street_address} onChange={(e) => onChange('street_address', e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: 12 }}>
            <div>
              <label className="label-caps" style={labelStyle}>City *</label>
              <input type="text" required placeholder="City" value={values.city} onChange={(e) => onChange('city', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="label-caps" style={labelStyle}>State</label>
              <input type="text" value={values.state || 'NY'} onChange={(e) => onChange('state', e.target.value)} style={{ ...inputStyle, backgroundColor: '#F0F0EE' }} readOnly />
            </div>
            <div>
              <label className="label-caps" style={labelStyle}>Zip *</label>
              <input type="text" required placeholder="10001" value={values.zip} onChange={(e) => onChange('zip', e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <label className="label-caps" style={labelStyle}>Product Categories of Interest</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px 16px', marginTop: 4 }}>
              {PRODUCT_CATEGORIES.map((cat) => {
                const selected = (values.product_categories || '').split(',').filter(Boolean);
                const isChecked = selected.includes(cat);
                return (
                  <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--color-charcoal)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const updated = isChecked
                          ? selected.filter((c) => c !== cat)
                          : [...selected, cat];
                        onChange('product_categories', updated.join(','));
                      }}
                      style={{ accentColor: 'var(--color-gold)' }}
                    />
                    {cat}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Monthly Volume */}
          <div>
            <label className="label-caps" style={labelStyle}>Estimated Monthly Volume</label>
            <select value={values.monthly_volume} onChange={(e) => onChange('monthly_volume', e.target.value)} style={inputStyle}>
              <option value="">Select volume range</option>
              <option value="Just Starting">Just Starting</option>
              <option value="$5K-$15K/month">$5K-$15K/month</option>
              <option value="$15K-$50K/month">$15K-$50K/month</option>
              <option value="$50K+/month">$50K+/month</option>
            </select>
          </div>

          {/* Referral Source */}
          <div>
            <label className="label-caps" style={labelStyle}>How Did You Hear About Us?</label>
            <input type="text" placeholder="Referral, trade show, online search, etc." value={values.referral_source} onChange={(e) => onChange('referral_source', e.target.value)} style={inputStyle} />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="label-caps" style={labelStyle}>Additional Notes</label>
            <textarea rows={4} placeholder="Anything else you'd like us to know about your operation..." value={values.message} onChange={(e) => onChange('message', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <button type="submit" disabled={status === 'submitting'} style={{
            backgroundColor: 'var(--color-gold)', color: '#fff', border: 'none', borderRadius: 9999,
            padding: '15px 28px', fontFamily: "'Barlow', Arial, sans-serif", fontWeight: 700,
            fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: 'var(--shadow-gold)', opacity: status === 'submitting' ? 0.6 : 1,
          }}>
            {status === 'submitting' ? 'Submitting...' : <>Submit Dispensary Application <ArrowRight size={14} /></>}
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--color-warm-gray)' }}>
            By submitting you agree to our{' '}
            <a href="/contact" style={{ color: 'var(--color-royal)' }}>Terms of Service</a>.
            We review all applications within 2 business days.
          </p>
        </>
      )}
    </FormSubmit>
  );
}
