'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Denormalized snapshot for display (title/price/supplier name) so the
// basket and checkout pages don't need extra round trips — but the actual
// POST /checkout payload only ever sends { listingId, quantity } (see
// packages/shared CheckoutRequest); price and stock are always
// recalculated server-side from the live listing, never trusted from here.
export interface BasketItem {
  listingId: string;
  title: string;
  unitPrice: number;
  quantity: number;
  supplierId: string;
  supplierName: string;
  collectionWindowStart: string;
  collectionWindowEnd: string;
  pickupAddress: string;
}

interface BasketState {
  items: BasketItem[];
  addItem: (item: Omit<BasketItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  removeItem: (listingId: string) => void;
  clear: () => void;
  subtotal: number;
  itemCount: number;
}

const BasketContext = createContext<BasketState | null>(null);
const STORAGE_KEY = 'findi_basket';

export function BasketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        // corrupt local state — start clean rather than crash the app
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(item: Omit<BasketItem, 'quantity'>, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.listingId === item.listingId);
      if (existing) {
        return prev.map((i) => (i.listingId === item.listingId ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { ...item, quantity }];
    });
  }

  function updateQuantity(listingId: string, quantity: number) {
    if (quantity <= 0) return removeItem(listingId);
    setItems((prev) => prev.map((i) => (i.listingId === listingId ? { ...i, quantity } : i)));
  }

  function removeItem(listingId: string) {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId));
  }

  function clear() {
    setItems([]);
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <BasketContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, subtotal, itemCount }}>
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error('useBasket must be used within BasketProvider');
  return ctx;
}
