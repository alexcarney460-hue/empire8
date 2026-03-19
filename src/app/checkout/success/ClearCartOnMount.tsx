'use client';

import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';

/**
 * Client component that clears the cart when the success page mounts.
 * Renders nothing visible — purely a side-effect component.
 */
export default function ClearCartOnMount() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
