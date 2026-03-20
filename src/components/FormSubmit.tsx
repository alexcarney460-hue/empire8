'use client';

import { useState, FormEvent, ReactNode } from 'react';
import { useVisitorTracking } from '@/hooks/useVisitorTracking';

interface Props {
  formType: 'contact' | 'wholesale' | 'distribution' | 'affiliate' | 'whitelabel';
  fields: string[];
  children: (props: {
    values: Record<string, string>;
    onChange: (field: string, value: string) => void;
    status: 'idle' | 'submitting' | 'success' | 'error';
    errorMsg: string;
  }) => ReactNode;
  buttonLabel?: string;
  successMessage?: string;
}

export default function FormSubmit({ formType, fields, children, successMessage }: Props) {
  const initial: Record<string, string> = {};
  for (const f of fields) initial[f] = '';

  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { getTrackingData } = useVisitorTracking();

  const onChange = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const tracking = getTrackingData();
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_type: formType, ...values, ...tracking }),
      });
      const json = await res.json();

      if (!json.ok) {
        setErrorMsg(json.error || 'Something went wrong');
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>&#10003;</div>
        <h3 className="font-heading" style={{ fontSize: '1.25rem', color: 'var(--color-charcoal)', marginBottom: 8 }}>
          {successMessage || 'Thank you!'}
        </h3>
        <p style={{ color: 'var(--color-warm-gray)', fontSize: '0.9rem' }}>
          We&apos;ll be in touch within 1 business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {children({ values, onChange, status, errorMsg })}
      {errorMsg && (
        <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: 0 }}>{errorMsg}</p>
      )}
    </form>
  );
}
