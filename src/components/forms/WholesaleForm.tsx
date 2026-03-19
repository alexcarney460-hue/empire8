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

export default function WholesaleForm() {
  return (
    <FormSubmit
      formType="wholesale"
      fields={['company_name', 'email', 'phone', 'business_type', 'monthly_volume']}
      successMessage="Application submitted!"
    >
      {({ values, onChange, status }) => (
        <>
          <div>
            <label className="label-caps" style={{ display: 'block', marginBottom: 8, color: 'var(--color-charcoal)', fontSize: '0.68rem' }}>Business Name</label>
            <input type="text" required placeholder="Your business name" value={values.company_name} onChange={(e) => onChange('company_name', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="label-caps" style={{ display: 'block', marginBottom: 8, color: 'var(--color-charcoal)', fontSize: '0.68rem' }}>Business Email</label>
            <input type="email" required placeholder="orders@yourbusiness.com" value={values.email} onChange={(e) => onChange('email', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="label-caps" style={{ display: 'block', marginBottom: 8, color: 'var(--color-charcoal)', fontSize: '0.68rem' }}>Phone Number</label>
            <input type="tel" required placeholder="(555) 000-0000" value={values.phone} onChange={(e) => onChange('phone', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="label-caps" style={{ display: 'block', marginBottom: 8, color: 'var(--color-charcoal)', fontSize: '0.68rem' }}>Business Type</label>
            <select required value={values.business_type} onChange={(e) => onChange('business_type', e.target.value)} style={inputStyle}>
              <option value="">Select your business type</option>
              <option>Hydro Store / Garden Center</option>
              <option>Licensed Cannabis Grow</option>
              <option>Dispensary</option>
              <option>Reseller / Distributor</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="label-caps" style={{ display: 'block', marginBottom: 8, color: 'var(--color-charcoal)', fontSize: '0.68rem' }}>Estimated Monthly Volume</label>
            <select required value={values.monthly_volume} onChange={(e) => onChange('monthly_volume', e.target.value)} style={inputStyle}>
              <option value="">Select volume range</option>
              <option>30-59 cases</option>
              <option>60-119 cases</option>
              <option>120-499 cases</option>
              <option>500+ cases</option>
            </select>
          </div>
          <button type="submit" disabled={status === 'submitting'} style={{
            backgroundColor: 'var(--color-royal)', color: '#fff', border: 'none', borderRadius: 9999,
            padding: '15px 28px', fontFamily: "'Barlow', Arial, sans-serif", fontWeight: 700,
            fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
            marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', boxShadow: 'var(--shadow-royal)', opacity: status === 'submitting' ? 0.6 : 1,
          }}>
            {status === 'submitting' ? 'Submitting...' : <>Submit Application <ArrowRight size={14} /></>}
          </button>
        </>
      )}
    </FormSubmit>
  );
}
