// Guest cart persisted in localStorage. Read through useSyncExternalStore (see
// components/site/cart-provider.tsx) so every component shares one snapshot and other
// tabs stay in sync. Prices here are for display only: checkout re-prices server-side.

import type { ProductMode } from "@/types/db";

export type CartItem = {
  key: string; // productId or productId:variantId
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  variantLabel: string | null;
  unitPrice: number;
  image: string | null;
  qty: number;
  maxQty: number | null; // stock limit when stock is tracked
};

export type AddToCartInput = Omit<CartItem, "key" | "qty"> & {
  qty?: number;
  mode: ProductMode;
};

const STORAGE_KEY = "paperica-cart-v1";
const MAX_QTY = 99;
const EMPTY: CartItem[] = [];

let cachedRaw: string | null | undefined;
let cachedItems: CartItem[] = EMPTY;
const listeners = new Set<() => void>();

function isCartItem(v: unknown): v is CartItem {
  if (typeof v !== "object" || v === null) return false;
  const i = v as CartItem;
  return (
    typeof i.key === "string" &&
    typeof i.productId === "string" &&
    typeof i.name === "string" &&
    typeof i.slug === "string" &&
    typeof i.unitPrice === "number" &&
    Number.isInteger(i.qty) &&
    i.qty > 0
  );
}

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getCartSnapshot(): CartItem[] {
  const raw = readStorage();
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedItems = Array.isArray(parsed) ? parsed.filter(isCartItem) : EMPTY;
  } catch {
    cachedItems = EMPTY;
  }
  return cachedItems;
}

export function getServerCartSnapshot(): CartItem[] {
  return EMPTY;
}

export function subscribeCart(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or blocked (private mode): the cart still works for this page view.
    cachedRaw = undefined;
    cachedItems = items;
  }
  listeners.forEach((l) => l());
}

function clampQty(qty: number, maxQty: number | null) {
  return Math.max(1, Math.min(qty, maxQty ?? MAX_QTY, MAX_QTY));
}

/** Adds an item. Returns false (and adds nothing) for WhatsApp-mode products. */
export function addToCart(input: AddToCartInput): boolean {
  if (input.mode !== "buy") return false;
  const { mode: _mode, qty = 1, ...rest } = input;
  void _mode;
  const key = rest.variantId ? `${rest.productId}:${rest.variantId}` : rest.productId;
  const items = getCartSnapshot();
  const existing = items.find((i) => i.key === key);

  write(
    existing
      ? items.map((i) =>
          i.key === key ? { ...i, ...rest, qty: clampQty(i.qty + qty, rest.maxQty) } : i,
        )
      : [...items, { ...rest, key, qty: clampQty(qty, rest.maxQty) }],
  );
  return true;
}

export function setCartQty(key: string, qty: number) {
  write(
    getCartSnapshot().map((i) => (i.key === key ? { ...i, qty: clampQty(qty, i.maxQty) } : i)),
  );
}

export function removeFromCart(key: string) {
  write(getCartSnapshot().filter((i) => i.key !== key));
}

export function clearCart() {
  write([]);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((n, i) => n + i.qty, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
}

type QuoteFix = {
  lines: { key: string; unitPrice: number; maxQty: number | null }[];
  issues: { key: string; kind: string; availableQty?: number }[];
};

/**
 * Brings the saved cart in line with the server's quote: current prices and stock limits,
 * reduced quantities where stock is short, and unavailable/sold-out items removed.
 * Returns true if anything changed.
 */
export function applyQuoteToCart({ lines, issues }: QuoteFix): boolean {
  const before = JSON.stringify(getCartSnapshot());
  const next = getCartSnapshot().flatMap((item) => {
    const issue = issues.find((i) => i.key === item.key);
    if (issue) {
      if (issue.kind === "insufficient_stock" && issue.availableQty && issue.availableQty > 0) {
        return [{ ...item, qty: issue.availableQty, maxQty: issue.availableQty }];
      }
      return [];
    }
    const line = lines.find((l) => l.key === item.key);
    return [line ? { ...item, unitPrice: line.unitPrice, maxQty: line.maxQty } : item];
  });
  if (JSON.stringify(next) === before) return false;
  write(next);
  return true;
}
