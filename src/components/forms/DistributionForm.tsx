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

export default function DistributionForm() {
  return (
    <FormSubmit
      formType="distribution"
      fields={['company_name', 'email', 'phone', 'website', 'operation_type', 'monthly_volume', 'message']}
      successMessage="Distribution application submitted!"
    >
      {({ values, onChange, status }) => (
        <>
          <div>
            <label className="label-caps" style={{ display: 'block', marginBottom: 8, fontSize: '0.68rem', color: 'var(--color-charcoal)' }}>Business Name</label>
            <input type="text" required placeholder="Legal business name" value={values.company_name} onChange={(e) => onChange('company_name', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="label-caps" style={{ display: 'block', marginBottom: 8, fontSize: '0.68rem', color: 'var(--color-charcoal)' }}>Business Email</label>
            <input type="email" required placeholder="orders@yourbusiness.com" value={values.email} onChange={(e) => onChange('email', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="label-caps" style={{ display: 'block', marginBottom: 8, fontSize: '0.68rem', color: 'var(--color-charcoal)' }}>Phone Number</label>
            <input type="tel" required placeholder="(555) 000-0000" value={values.phone} onChange={(e) => onChange('phone', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="label-caps" style={{ display: 'block', marginBottom: 8, fontSize: '0.68rem', color: 'var(--color-charcoal)' }}>Website (optional)</label>
            <input type="url" placeholder="https://yourbusiness.com" value={values.website} onChange={(e) => onChange('website', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="label-caps" style={{ display: 'block', marginBottom: 8, fontSize: '0.68rem', color: 'var(--color-charcoal)' }}>Operation Type</label>
            <select required value={values.operation_type} onChange={(e) => onChange('operation_type', e.target.value)} style={inputStyle}>
              <option value="">Select your operation type</option>
              <option>Licensed Cannabis Grow</option>
              <option>Commercial Greenhouse</option>
              <option>Product Reseller / Distributor</option>
              <option>Hydro Store Chain (3+ locations)</option>
              <option>Dispensary Group</option>
              <option>Other Commercial Operation</option>
            </select>
          </div>
          <div>
            <label className="label-caps" style={{ display: 'block', marginBottom: 8, fontSize: '0.68rem', color: 'var(--color-charcoal)' }}>Estimated Monthly Volume</label>
            <select required value={values.monthly_volume} onChange={(e) => onChange('monthly_volume', e.target.value)} style={inputStyle}>
              <option value="">Select volume range</option>
              <option>25-50 cases / month</option>
              <option>51-100 cases / month</option>
              <option>101-250 cases / month</option>
              <option>250+ cases / month</option>
            </select>
          </div>
          <div>
            <label className="label-caps" style={{ display: 'block', marginBottom: 8, fontSize: '0.68rem', color: 'var(--color-charcoal)' }}>Tell Us About Your Operation</label>
            <textarea rows={4} placeholder="Brief description of your operation and how you'd use our products..." value={values.message} onChange={(e) => onChange('message', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <button type="submit" disabled={status === 'submitting'} style={{
            backgroundColor: 'var(--color-gold)', color: '#fff', border: 'none', borderRadius: 9999,
            padding: '15px 28px', fontFamily: "'Barlow', Arial, sans-serif", fontWeight: 700,
            fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: 'var(--shadow-gold)', opacity: status === 'submitting' ? 0.6 : 1,
          }}>
            {status === 'submitting' ? 'Submitting...' : <>Submit Distribution Application <ArrowRight size={14} /></>}
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--color-warm-gray)' }}>
            By submitting you agree to our{' '}
            <a href="/contact" style={{ color: 'var(--color-royal)' }}>Terms of Service</a>.
            We review all applications within 1 business day.
          </p>
        </>
      )}
    </FormSubmit>
  );
}
