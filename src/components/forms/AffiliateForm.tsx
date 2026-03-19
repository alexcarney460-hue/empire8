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

export default function AffiliateForm() {
  return (
    <FormSubmit
      formType="affiliate"
      fields={['first_name', 'email', 'handle_url', 'audience_size', 'channels', 'message']}
      successMessage="Affiliate application submitted!"
    >
      {({ values, onChange, status }) => (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="e8-name-row">
            <div>
              <label className="label-caps" style={{ display: 'block', marginBottom: 8, color: 'var(--color-charcoal)', fontSize: '0.68rem' }}>Full Name</label>
              <input type="text" required placeholder="Your name" value={values.first_name} onChange={(e) => onChange('first_name', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="label-caps" style={{ display: 'block', marginBottom: 8, color: 'var(--color-charcoal)', fontSize: '0.68rem' }}>Email</label>
              <input type="email" required placeholder="you@example.com" value={values.email} onChange={(e) => onChange('email', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label className="label-caps" style={{ display: 'block', marginBottom: 8, color: 'var(--color-charcoal)', fontSize: '0.68rem' }}>Primary Handle / URL</label>
            <input type="text" placeholder="@username or https://yourchannel.com" value={values.handle_url} onChange={(e) => onChange('handle_url', e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="e8-name-row">
            <div>
              <label className="label-caps" style={{ display: 'block', marginBottom: 8, color: 'var(--color-charcoal)', fontSize: '0.68rem' }}>Audience Size</label>
              <input type="text" placeholder="e.g. 12k followers" value={values.audience_size} onChange={(e) => onChange('audience_size', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="label-caps" style={{ display: 'block', marginBottom: 8, color: 'var(--color-charcoal)', fontSize: '0.68rem' }}>Primary Channels</label>
              <input type="text" placeholder="YouTube, TikTok, Email, etc." value={values.channels} onChange={(e) => onChange('channels', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label className="label-caps" style={{ display: 'block', marginBottom: 8, color: 'var(--color-charcoal)', fontSize: '0.68rem' }}>Notes / Pitch</label>
            <textarea rows={4} placeholder="Tell us about your audience and content style." value={values.message} onChange={(e) => onChange('message', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <button type="submit" disabled={status === 'submitting'} style={{
            backgroundColor: 'var(--color-gold)', color: '#fff', border: 'none', borderRadius: 9999,
            padding: '15px 28px', fontFamily: "'Barlow', Arial, sans-serif", fontWeight: 700,
            fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: 'var(--shadow-gold)', opacity: status === 'submitting' ? 0.6 : 1,
          }}>
            {status === 'submitting' ? 'Submitting...' : <>Apply Now <ArrowRight size={14} /></>}
          </button>
        </>
      )}
    </FormSubmit>
  );
}
