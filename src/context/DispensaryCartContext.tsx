'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface CartItem {
  productId: string;
  brandId: string;
  brandName: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl: string | null;
  unitType: string;
}

interface BrandGroup {
  brandId: string;
  brandName: string;
  items: CartItem[];
  subtotalCents: number;
}

interface DispensaryCartContextType {
  items: ReadonlyArray<CartItem>;
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  getItemsByBrand: () => ReadonlyArray<BrandGroup>;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

/* ── Constants ─────────────────────────────────────────────────────── */

const STORAGE_KEY = 'empire8_cart';
const MAX_QTY = 10_000;

/* ── Context ───────────────────────────────────────────────────────── */

const DispensaryCartContext = createContext<DispensaryCartContextType | undefined>(undefined);

/* ── Helpers ───────────────────────────────────────────────────────── */

function readFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CartItem[];
  } catch {
    return [];
  }
}

function writeToStorage(items: ReadonlyArray<CartItem>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage may be full or unavailable
  }
}

/* ── Provider ──────────────────────────────────────────────────────── */

export function DispensaryCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readFromStorage());
  const [isOpen, setIsOpen] = useState(false);

  // Persist to localStorage on change
  useEffect(() => {
    writeToStorage(items);
  }, [items]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const addToCart = useCallback(
    (newItem: Omit<CartItem, 'quantity'>, qty = 1) => {
      const safeQty = Math.max(1, Math.min(Math.floor(qty), MAX_QTY));
      setItems((current) => {
        const idx = current.findIndex((i) => i.productId === newItem.productId);
        if (idx >= 0) {
          return current.map((item, i) =>
            i === idx
              ? { ...item, quantity: Math.min(item.quantity + safeQty, MAX_QTY) }
              : item,
          );
        }
        return [...current, { ...newItem, quantity: safeQty }];
      });
      setIsOpen(true);
    },
    [],
  );

  const removeFromCart = useCallback((productId: string) => {
    setItems((current) => current.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    const safeQty = Math.floor(qty);
    if (safeQty < 1) {
      setItems((current) => current.filter((i) => i.productId !== productId));
      return;
    }
    const clampedQty = Math.min(safeQty, MAX_QTY);
    setItems((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity: clampedQty } : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getCartTotal = useCallback(
    () => items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0),
    [items],
  );

  const getCartItemCount = useCallback(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const getItemsByBrand = useCallback((): ReadonlyArray<BrandGroup> => {
    const brandMap = new Map<string, BrandGroup>();
    for (const item of items) {
      const existing = brandMap.get(item.brandId);
      if (existing) {
        brandMap.set(item.brandId, {
          ...existing,
          items: [...existing.items, item],
          subtotalCents: existing.subtotalCents + item.unitPriceCents * item.quantity,
        });
      } else {
        brandMap.set(item.brandId, {
          brandId: item.brandId,
          brandName: item.brandName,
          items: [item],
          subtotalCents: item.unitPriceCents * item.quantity,
        });
      }
    }
    return Array.from(brandMap.values());
  }, [items]);

  const value = useMemo<DispensaryCartContextType>(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount,
      getItemsByBrand,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    }),
    [items, isOpen, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemCount, getItemsByBrand],
  );

  return (
    <DispensaryCartContext.Provider value={value}>
      {children}
    </DispensaryCartContext.Provider>
  );
}

/* ── Hook ──────────────────────────────────────────────────────────── */

export function useDispensaryCart(): DispensaryCartContextType {
  const ctx = useContext(DispensaryCartContext);
  if (!ctx) {
    throw new Error('useDispensaryCart must be used within a DispensaryCartProvider');
  }
  return ctx;
}
