'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'empire8_age_verified';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const PURPLE = '#4A0E78';
const PURPLE_DARK = '#2D0849';
const PURPLE_LIGHT = '#6B2FA0';
const GOLD = '#C8A23C';
const GOLD_HOVER = '#B08E2E';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isVerifiedRecently(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const timestamp = parseInt(stored, 10);
    if (isNaN(timestamp)) return false;
    return Date.now() - timestamp < THIRTY_DAYS_MS;
  } catch {
    return false;
  }
}

function calculateAge(month: number, day: number, year: number): number {
  const today = new Date();
  const birthDate = new Date(year, month - 1, day);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    setVerified(isVerifiedRecently());
  }, []);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const years = useMemo(() => {
    const result: number[] = [];
    for (let y = currentYear; y >= currentYear - 120; y--) {
      result.push(y);
    }
    return result;
  }, [currentYear]);

  const days = useMemo(() => {
    const result: number[] = [];
    for (let d = 1; d <= 31; d++) {
      result.push(d);
    }
    return result;
  }, []);

  const handleSubmit = useCallback(() => {
    setError('');

    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    const y = parseInt(year, 10);

    if (!m || !d || !y) {
      setError('Please enter your complete date of birth.');
      return;
    }

    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > currentYear) {
      setError('Please enter a valid date of birth.');
      return;
    }

    const testDate = new Date(y, m - 1, d);
    if (
      testDate.getFullYear() !== y ||
      testDate.getMonth() !== m - 1 ||
      testDate.getDate() !== d
    ) {
      setError('Please enter a valid date of birth.');
      return;
    }

    const age = calculateAge(m, d, y);

    if (age < 21) {
      setDenied(true);
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // localStorage unavailable; allow entry anyway
    }
    setVerified(true);
  }, [month, day, year, currentYear]);

  // SSR and initial check: render nothing until hydrated
  if (verified === null) {
    return null;
  }

  // Already verified
  if (verified) {
    return <>{children}</>;
  }

  const selectStyle: React.CSSProperties = {
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    color: '#fff',
    padding: '12px 16px',
    fontSize: '0.95rem',
    fontFamily: "'Barlow', Arial, sans-serif",
    cursor: 'pointer',
    outline: 'none',
    flex: 1,
    minWidth: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='1.5'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 36,
  };

  const selectOptionStyle: React.CSSProperties = {
    backgroundColor: PURPLE_DARK,
    color: '#fff',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: PURPLE_DARK,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundImage: `radial-gradient(circle at 30% 20%, rgba(74,14,120,0.6) 0%, transparent 50%),
                          radial-gradient(circle at 70% 80%, rgba(200,162,60,0.08) 0%, transparent 40%)`,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Age verification"
    >
      <div
        style={{
          backgroundColor: PURPLE,
          borderRadius: 24,
          padding: '48px 40px',
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 40px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Logo / Brand Mark */}
        <div
          style={{
            width: 72,
            height: 72,
            margin: '0 auto 20px',
            borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${GOLD}`,
          }}
        >
          <span
            style={{
              fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
              fontWeight: 800,
              fontSize: '1.6rem',
              color: GOLD,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            E8
          </span>
        </div>

        <h1
          style={{
            fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
            fontWeight: 700,
            fontSize: '1.5rem',
            color: '#fff',
            marginBottom: 8,
            letterSpacing: '0.02em',
          }}
        >
          Empire 8 Sales Direct
        </h1>

        {denied ? (
          <>
            <div
              style={{
                backgroundColor: 'rgba(192,57,43,0.2)',
                border: '1px solid rgba(192,57,43,0.4)',
                borderRadius: 12,
                padding: '20px 16px',
                marginTop: 24,
              }}
            >
              <p
                style={{
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Access Denied
              </p>
              <p
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                }}
              >
                Sorry, you must be 21 or older to access this site.
              </p>
            </div>
          </>
        ) : (
          <>
            <p
              style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                marginBottom: 32,
              }}
            >
              You must be 21 years or older to view this site.
              <br />
              Please enter your date of birth.
            </p>

            {/* DOB Selects */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 16,
              }}
            >
              {/* Month */}
              <select
                value={month}
                onChange={(e) => { setMonth(e.target.value); setError(''); }}
                style={selectStyle}
                aria-label="Birth month"
              >
                <option value="" style={selectOptionStyle}>Month</option>
                {MONTHS.map((name, i) => (
                  <option key={name} value={String(i + 1)} style={selectOptionStyle}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Day */}
              <select
                value={day}
                onChange={(e) => { setDay(e.target.value); setError(''); }}
                style={{ ...selectStyle, maxWidth: 100 }}
                aria-label="Birth day"
              >
                <option value="" style={selectOptionStyle}>Day</option>
                {days.map((d) => (
                  <option key={d} value={String(d)} style={selectOptionStyle}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Year */}
              <select
                value={year}
                onChange={(e) => { setYear(e.target.value); setError(''); }}
                style={{ ...selectStyle, maxWidth: 110 }}
                aria-label="Birth year"
              >
                <option value="" style={selectOptionStyle}>Year</option>
                {years.map((y) => (
                  <option key={y} value={String(y)} style={selectOptionStyle}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p
                style={{
                  color: '#ff6b6b',
                  fontSize: '0.85rem',
                  marginBottom: 12,
                }}
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              style={{
                width: '100%',
                backgroundColor: GOLD,
                color: '#fff',
                border: 'none',
                borderRadius: 9999,
                padding: '14px 28px',
                fontFamily: "'Barlow', Arial, sans-serif",
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: `0 8px 28px rgba(200,162,60,0.35)`,
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.backgroundColor = GOLD_HOVER; }}
              onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.backgroundColor = GOLD; }}
            >
              Enter Site
            </button>

            <p
              style={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: '0.72rem',
                marginTop: 20,
                lineHeight: 1.5,
              }}
            >
              By entering this site you acknowledge that you are of legal age
              to view cannabis-related content in your jurisdiction.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
