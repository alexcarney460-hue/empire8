'use client';

import { useEffect, useState } from 'react';

type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

type InventoryMap = Record<string, InventoryStatus>;

let cachedInventory: InventoryMap | null = null;
let fetchPromise: Promise<InventoryMap> | null = null;

async function fetchInventory(): Promise<InventoryMap> {
  if (cachedInventory) return cachedInventory;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/api/inventory')
    .then((res) => res.json())
    .then((json) => {
      const map: InventoryMap = {};
      if (json.ok && Array.isArray(json.inventory)) {
        for (const item of json.inventory) {
          map[item.slug] = item.status;
        }
      }
      cachedInventory = map;
      // Expire cache after 60 seconds
      setTimeout(() => { cachedInventory = null; fetchPromise = null; }, 60_000);
      return map;
    })
    .catch(() => {
      fetchPromise = null;
      return {} as InventoryMap;
    });

  return fetchPromise;
}

const BADGE_CONFIG: Record<InventoryStatus, { label: string; color: string; bg: string; dot: string }> = {
  in_stock: { label: 'In Stock', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)', dot: '#16A34A' },
  low_stock: { label: 'Low Stock', color: '#D97706', bg: 'rgba(217, 119, 6, 0.08)', dot: '#D97706' },
  out_of_stock: { label: 'Out of Stock', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.08)', dot: '#DC2626' },
};

type Props = {
  slug: string;
  /** Compact mode for product cards (smaller text, no background) */
  compact?: boolean;
};

export default function InventoryBadge({ slug, compact = false }: Props) {
  const [status, setStatus] = useState<InventoryStatus | null>(null);

  useEffect(() => {
    fetchInventory().then((map) => {
      setStatus(map[slug] ?? null);
    });
  }, [slug]);

  // Don't render anything until we know status (avoids layout shift)
  if (!status) return null;

  const config = BADGE_CONFIG[status];

  if (compact) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: '0.7rem',
          fontWeight: 600,
          color: config.color,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: config.dot,
            flexShrink: 0,
          }}
        />
        {config.label}
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: '0.78rem',
        fontWeight: 600,
        color: config.color,
        backgroundColor: config.bg,
        padding: '4px 12px',
        borderRadius: 9999,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: config.dot,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}
