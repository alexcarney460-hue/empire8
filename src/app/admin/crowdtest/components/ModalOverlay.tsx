'use client';

import { COLORS } from '@/lib/admin/theme';
import { BORDER } from './shared';

export function ModalOverlay({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: 28,
          minWidth: 380,
          maxWidth: 480,
        }}
      >
        {children}
      </div>
    </div>
  );
}
