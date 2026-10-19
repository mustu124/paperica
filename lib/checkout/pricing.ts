import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { CartItemInput } from "./schema";

export type QuoteLine = {
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantLabel: string | null;
  slug: string;
  image: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  maxQty: number | null;
};

export type QuoteIssue = {
  key: string;
  productId: string;
  variantId: string | null;
  name: string | null;
  kind: "unavailable" | "not_purchasable" | "variant_required" | "out_of_stock" | "insufficient_stock";
  message: string;
  availableQty?: number;
};

export type Quote = {
  lines: QuoteLine[];
  issues: QuoteIssue[];
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingThreshold: number | null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const keyOf = (productId: string, variantId?: string | null) => (variantId ? `${productId}:${variantId}` : productId);

/**
 * Prices a cart from the database (never from client prices): current price, active,
 * mode = "buy", stock, plus shipping from site_settings. Used for the checkout summary and
 * again, authoritatively, when the order is created.
 */
export async function priceItems(items: CartItemInput[]): Promise<Quote> {
  // Merge duplicate lines.
  const merged = new Map<string, CartItemInput>();
  for (const it of items) {
    const key = keyOf(it.productId, it.variantId);
    const prev = merged.get(key);
    merged.set(key, { ...it, qty: Math.min((prev?.qty ?? 0) + it.qty, 99) });
  }
  const wanted = [...merged.values()];
  const productIds = [...new Set(wanted.map((i) => i.productId))];

  const supabase = createPublicClient(); // RLS: active products only
  const [products, variants, images, settings] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, price_inr, mode, track_stock, stock_qty")
      .in("id", productIds),
    supabase
      .from("product_variants")
      .select("id, product_id, label, option_group, price_override, stock_qty")
      .in("product_id", productIds),
    supabase.from("product_images").select("product_id, url, sort_order").in("product_id", productIds).order("sort_order"),
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["standard_shipping_fee_inr", "free_shipping_threshold_inr"]),
  ]);
  const failed = products.error ?? variants.error ?? images.error ?? settings.error;
  if (failed) throw new Error(`Pricing lookup failed: ${failed.message}`);
  const productRows = products.data ?? [];
  const variantRows = variants.data ?? [];
  const imageRows = images.data ?? [];
  const settingRows = settings.data ?? [];

  const lines: QuoteLine[] = [];
  const issues: QuoteIssue[] = [];

  for (const item of wanted) {
    const key = keyOf(item.productId, item.variantId);
    const p = productRows.find((x) => x.id === item.productId);
    const base = { key, productId: item.productId, variantId: item.variantId ?? null };
    if (!p) {
      issues.push({ ...base, name: null, kind: "unavailable", message: "This product is no longer available." });
      continue;
    }
    if (p.mode !== "buy" || p.price_inr == null) {
      issues.push({ ...base, name: p.name, kind: "not_purchasable", message: `${p.name} is made to order — please enquire on WhatsApp.` });
      continue;
    }
    const ownVariants = variantRows.filter((v) => v.product_id === p.id);
    const variant = item.variantId ? ownVariants.find((v) => v.id === item.variantId) : undefined;
    if ((item.variantId && !variant) || (!item.variantId && ownVariants.length > 0)) {
      issues.push({ ...base, name: p.name, kind: "variant_required", message: `Please choose an option for ${p.name}.` });
      continue;
    }

    const available = p.track_stock ? (variant?.stock_qty ?? p.stock_qty ?? 0) : null;
    const label = variant ? `${variant.option_group}: ${variant.label}` : null;
    const displayName = label ? `${p.name} (${label})` : p.name;
    if (available !== null && available <= 0) {
      issues.push({ ...base, name: p.name, kind: "out_of_stock", message: `${displayName} is sold out.`, availableQty: 0 });
      continue;
    }
    if (available !== null && item.qty > available) {
      issues.push({
        ...base,
        name: p.name,
        kind: "insufficient_stock",
        message: `Only ${available} of ${displayName} left in stock.`,
        availableQty: available,
      });
      continue;
    }

    const unitPrice = Number(variant?.price_override ?? p.price_inr);
    lines.push({
      ...base,
      name: p.name,
      variantLabel: label,
      slug: p.slug,
      image: imageRows.find((i) => i.product_id === p.id)?.url ?? null,
      unitPrice,
      qty: item.qty,
      lineTotal: round2(unitPrice * item.qty),
      maxQty: available,
    });
  }

  const setting = (k: string) => settingRows.find((s) => s.key === k)?.value;
  const toNum = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : null);
  const fee = toNum(setting("standard_shipping_fee_inr"));
  const threshold = toNum(setting("free_shipping_threshold_inr"));
  if (fee == null || Number.isNaN(fee)) console.warn("[checkout] standard_shipping_fee_inr is not set; charging no shipping");

  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const shipping =
    lines.length === 0 || fee == null || Number.isNaN(fee) || (threshold != null && subtotal >= threshold) ? 0 : fee;

  return {
    lines,
    issues,
    subtotal,
    shipping: round2(shipping),
    total: round2(subtotal + shipping),
    freeShippingThreshold: threshold,
  };
}
