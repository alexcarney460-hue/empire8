'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PurchasePlan = 'one-time' | 'autoship';

export type PurchaseUnit = 'box' | 'case';

export type CartItem = {
  id: string;       // product slug
  name: string;
  price: number;    // unit price already accounting for plan/tier
  quantity: number;
  plan: PurchasePlan;
  img: string;
  unit: string;
  purchaseUnit?: PurchaseUnit;  // 'box' or 'case' for gloves; undefined for non-glove items
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, addQty?: number) => void;
  removeItem: (id: string, plan: PurchasePlan, purchaseUnit?: PurchaseUnit) => void;
  updateQty: (id: string, plan: PurchasePlan, qty: number, purchaseUnit?: PurchaseUnit) => void;
  clearCart: () => void;
  total: number;
  count: number;
  totalCaseCount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = window.localStorage.getItem('e8-cart');
    if (!saved) return [];
    try {
      const parsed: CartItem[] = JSON.parse(saved);
      return parsed.map((item) => ({
        ...item,
        plan: item.plan ?? 'one-time',
        // Backward compatibility: existing items without purchaseUnit stay as-is
      }));
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('e8-cart', JSON.stringify(items));
  }, [items]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const addItem = (newItem: Omit<CartItem, 'quantity'>, addQty = 1) => {
    // Guard: ignore non-positive quantities
    const safeQty = Math.max(1, Math.floor(addQty));
    setItems((current) => {
      const existing = current.find(
        (i) => i.id === newItem.id && i.plan === newItem.plan && (i.purchaseUnit ?? 'box') === (newItem.purchaseUnit ?? 'box')
      );
      if (existing) {
        return current.map((i) =>
          i.id === newItem.id && i.plan === newItem.plan && (i.purchaseUnit ?? 'box') === (newItem.purchaseUnit ?? 'box')
            ? { ...i, quantity: i.quantity + safeQty }
            : i
        );
      }
      return [...current, { ...newItem, quantity: safeQty }];
    });
    setIsOpen(true);
  };

  const removeItem = (id: string, plan: PurchasePlan, purchaseUnit?: PurchaseUnit) => {
    setItems((current) => current.filter(
      (i) => !(i.id === id && i.plan === plan && (i.purchaseUnit ?? 'box') === (purchaseUnit ?? 'box'))
    ));
  };

  const updateQty = (id: string, plan: PurchasePlan, qty: number, purchaseUnit?: PurchaseUnit) => {
    const safeQty = Math.floor(qty);
    if (safeQty < 1) {
      removeItem(id, plan, purchaseUnit);
      return;
    }
    // Cap at 10,000 to match server-side limit
    const clampedQty = Math.min(safeQty, 10000);
    setItems((current) =>
      current.map((i) =>
        i.id === id && i.plan === plan && (i.purchaseUnit ?? 'box') === (purchaseUnit ?? 'box')
          ? { ...i, quantity: clampedQty }
          : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalCaseCount = items
    .filter((i) => i.purchaseUnit === 'case')
    .reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, clearCart,
      total, count, totalCaseCount, isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
