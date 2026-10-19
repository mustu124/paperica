"use client";

import { createContext, use, useCallback, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  addToCart,
  cartCount,
  cartSubtotal,
  getCartSnapshot,
  getServerCartSnapshot,
  removeFromCart,
  setCartQty,
  subscribeCart,
  type AddToCartInput,
  type CartItem,
} from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  /** False during server render and hydration, before the saved cart has been read. */
  ready: boolean;
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Adds the item and opens the drawer. Returns false for WhatsApp-mode products. */
  add: (input: AddToCartInput) => boolean;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const noopSubscribe = () => () => {};

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const add = useCallback((input: AddToCartInput) => {
    const added = addToCart(input);
    if (added) setIsOpen(true);
    return added;
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      count: cartCount(items),
      subtotal: cartSubtotal(items),
      isOpen,
      open,
      close,
      add,
      setQty: setCartQty,
      remove: removeFromCart,
    }),
    [items, ready, isOpen, open, close, add],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = use(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
