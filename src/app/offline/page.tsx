'use client';

export default function OfflinePage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--color-charcoal)' }}
    >
      {/* Logo */}
      <img
        src="/logo.png"
        alt="Empire 8"
        width={120}
        height={120}
        className="mb-8 opacity-80"
      />

      {/* Heading */}
      <h1
        className="font-display mb-3 text-3xl font-bold tracking-tight"
        style={{ color: 'var(--color-gold)' }}
      >
        You&apos;re offline
      </h1>

      {/* Description */}
      <p className="mx-auto mb-8 max-w-sm text-base" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
        Check your internet connection and try again.
      </p>

      {/* Retry */}
      <button
        onClick={() => window.location.reload()}
        className="rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:brightness-110"
        style={{
          background: 'linear-gradient(135deg, var(--color-royal) 0%, var(--color-royal-dark) 100%)',
          color: '#fff',
          boxShadow: 'var(--shadow-royal)',
          border: '1px solid rgba(200, 162, 60, 0.2)',
        }}
      >
        Retry connection
      </button>

      {/* Decorative border line */}
      <div
        className="mt-16 h-px w-24"
        style={{ background: 'linear-gradient(90deg, transparent, var(--color-gold), transparent)' }}
      />
    </main>
  );
}
