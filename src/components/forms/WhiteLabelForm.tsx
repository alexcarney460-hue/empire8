'use client';

import { ArrowRight } from 'lucide-react';
import FormSubmit from '@/components/FormSubmit';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1px solid rgba(200,162,60,0.2)',
  fontSize: '0.88rem',
  color: '#fff',
  background: 'rgba(255,255,255,0.06)',
  outline: 'none',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: '0.68rem',
  color: 'rgba(255,255,255,0.7)',
};

const PRODUCT_TYPES = [
  'Flower', 'Pre-Rolls', 'Vapes/Cartridges', 'Edibles',
  'Concentrates', 'Tinctures', 'Beverages', 'Topicals', 'Other',
];

export default function WhiteLabelForm() {
  return (
    <FormSubmit
      formType="whitelabel"
      fields={[
        'brand_name', 'contact_name', 'email', 'phone',
        'company_name', 'website', 'product_types', 'target_market',
        'estimated_volume', 'timeline', 'notes',
      ]}
    >
      {({ values, onChange, status }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="e8-name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label-caps" style={labelStyle}>Brand Name *</label>
              <input type="text" required placeholder="Your brand name" value={values.brand_name} onChange={(e) => onChange('brand_name', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="label-caps" style={labelStyle}>Contact Name *</label>
              <input type="text" required placeholder="Full name" value={values.contact_name} onChange={(e) => onChange('contact_name', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div className="e8-name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label-caps" style={labelStyle}>Email *</label>
              <input type="email" required placeholder="you@company.com" value={values.email} onChange={(e) => onChange('email', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="label-caps" style={labelStyle}>Phone</label>
              <input type="tel" placeholder="(555) 000-0000" value={values.phone} onChange={(e) => onChange('phone', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div className="e8-name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label-caps" style={labelStyle}>Company Name</label>
              <input type="text" placeholder="If applicable" value={values.company_name} onChange={(e) => onChange('company_name', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="label-caps" style={labelStyle}>Website</label>
              <input type="url" placeholder="https://..." value={values.website} onChange={(e) => onChange('website', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label className="label-caps" style={labelStyle}>Product Types of Interest</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginTop: 4 }}>
              {PRODUCT_TYPES.map((type) => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={(values.product_types || '').split(',').includes(type)}
                    onChange={(e) => {
                      const current = (values.product_types || '').split(',').filter(Boolean);
                      const updated = e.target.checked
                        ? [...current, type]
                        : current.filter((t) => t !== type);
                      onChange('product_types', updated.join(','));
                    }}
                    style={{ accentColor: '#C8A23C' }}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label-caps" style={labelStyle}>Target Market</label>
            <select value={values.target_market} onChange={(e) => onChange('target_market', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Select target market</option>
              <option value="adult_use_retail">Adult-Use Retail (Dispensaries)</option>
              <option value="medical">Medical Cannabis</option>
              <option value="both">Both Adult-Use and Medical</option>
              <option value="online_only">Online / DTC</option>
            </select>
          </div>

          <div className="e8-name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label-caps" style={labelStyle}>Estimated Monthly Volume</label>
              <select value={values.estimated_volume} onChange={(e) => onChange('estimated_volume', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select volume</option>
                <option value="startup">Just Starting Out</option>
                <option value="500_2500">500 - 2,500 units/month</option>
                <option value="2500_10000">2,500 - 10,000 units/month</option>
                <option value="10000_plus">10,000+ units/month</option>
              </select>
            </div>
            <div>
              <label className="label-caps" style={labelStyle}>Timeline to Launch</label>
              <select value={values.timeline} onChange={(e) => onChange('timeline', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select timeline</option>
                <option value="immediately">Immediately</option>
                <option value="1_3_months">1-3 Months</option>
                <option value="3_6_months">3-6 Months</option>
                <option value="6_plus_months">6+ Months</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-caps" style={labelStyle}>Tell Us About Your Vision</label>
            <textarea
              rows={4}
              placeholder="Describe your brand concept, target audience, product ideas..."
              value={values.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            style={{
              width: '100%', padding: '14px 24px', borderRadius: 9999,
              backgroundColor: status === 'submitting' ? '#8B7530' : '#C8A23C',
              color: '#1A0633', border: 'none',
              fontFamily: "'Barlow', Arial, sans-serif", fontWeight: 700,
              fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: status === 'submitting' ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 24px rgba(200,162,60,0.35)',
            }}
          >
            {status === 'submitting' ? 'Submitting...' : <>Submit Application <ArrowRight size={14} /></>}
          </button>
        </div>
      )}
    </FormSubmit>
  );
}
