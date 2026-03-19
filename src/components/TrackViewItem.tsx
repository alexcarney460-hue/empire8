'use client';

import { useEffect } from 'react';
import { trackViewItem, fbTrackViewContent } from '@/lib/analytics';

type Props = {
  id: string;
  name: string;
  price: number;
  category?: string;
};

/**
 * Invisible client component that fires GA4 `view_item` and
 * Meta Pixel `ViewContent` events when a product page loads.
 * Drop into any server-rendered product page.
 */
export default function TrackViewItem({ id, name, price, category }: Props) {
  useEffect(() => {
    const item = { id, name, price, category };
    trackViewItem(item);
    fbTrackViewContent(item);
  }, [id, name, price, category]);

  return null;
}
