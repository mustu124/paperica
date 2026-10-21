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
  /** Added by the free-gift offer (price 0; not part of the customer's cart). */
  free?: boolean;
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

/**
 * Free-gift offer (site settings gift_offer_*): buying `minQty` products marked New adds one
 * free `gift_offer_product_slug` to the order.
 *   applied      the free item is in `lines`
 *   add_more     `remaining` more New products needed
 *   unavailable  the free item is sold out or hidden, so it can't be added
 */
export type QuoteOffer = { text: string; status: "applied" | "add_more" | "unavailable"; remaining: number };

export type Quote = {
  lines: QuoteLine[];
  issues: QuoteIssue[];
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingThreshold: number | null;
  offer: QuoteOffer | null;
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
      .select("id, name, slug, price_inr, mode, track_stock, stock_qty, is_new")
      .in("id", productIds),
    supabase
      .from("product_variants")
      .select("id, product_id, label, option_group, price_override, stock_qty")
      .in("product_id", productIds),
    supabase.from("product_images").select("product_id, url, sort_order").in("product_id", productIds).order("sort_order"),
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "standard_shipping_fee_inr",
        "free_shipping_threshold_inr",
        "gift_offer_enabled",
        "gift_offer_text",
        "gift_offer_min_qty",
        "gift_offer_product_slug",
      ]),
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

  const offer = await applyGiftOffer(lines, productRows, setting, toNum);

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
    offer,
  };
}

/** Adds the free gift line when the cart qualifies (see QuoteOffer). Mutates `lines`. */
async function applyGiftOffer(
  lines: QuoteLine[],
  productRows: { id: string; is_new: boolean }[],
  setting: (k: string) => unknown,
  toNum: (v: unknown) => number | null,
): Promise<QuoteOffer | null> {
  const enabled = setting("gift_offer_enabled") === true || setting("gift_offer_enabled") === "true";
  const slug = typeof setting("gift_offer_product_slug") === "string" ? (setting("gift_offer_product_slug") as string).trim() : "";
  const text = typeof setting("gift_offer_text") === "string" ? (setting("gift_offer_text") as string).trim() : "";
  const minQty = Math.max(1, Math.floor(toNum(setting("gift_offer_min_qty")) ?? 2));
  if (!enabled || !slug || lines.length === 0) return null;

  const supabase = createPublicClient(); // RLS: active products only
  const { data: gift, error } = await supabase
    .from("products")
    .select("id, name, slug, track_stock, stock_qty")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Gift lookup failed: ${error.message}`);

  // The free item itself never counts towards the offer.
  const isNew = new Set(productRows.filter((p) => p.is_new && p.id !== gift?.id).map((p) => p.id));
  const qualifying = lines.reduce((n, l) => n + (isNew.has(l.productId) ? l.qty : 0), 0);
  if (qualifying === 0) return null;
  if (qualifying < minQty) return { text, status: "add_more", remaining: minQty - qualifying };
  if (!gift) return { text, status: "unavailable", remaining: 0 };

  // Stock left after what the customer is already buying of the same item.
  const inCart = (variantId: string | null) =>
    lines.filter((l) => l.productId === gift.id && l.variantId === variantId).reduce((n, l) => n + l.qty, 0);
  const [variantRes, imageRes] = await Promise.all([
    supabase.from("product_variants").select("id, label, option_group, stock_qty").eq("product_id", gift.id).order("sort_order"),
    supabase.from("product_images").select("url").eq("product_id", gift.id).order("sort_order").limit(1),
  ]);
  if (variantRes.error || imageRes.error) throw new Error(`Gift lookup failed: ${(variantRes.error ?? imageRes.error)?.message}`);
  const variants = variantRes.data ?? [];
  const pick = variants.length
    ? variants.find((v) => !gift.track_stock || (v.stock_qty ?? gift.stock_qty ?? 0) - inCart(v.id) >= 1)
    : !gift.track_stock || (gift.stock_qty ?? 0) - inCart(null) >= 1
      ? null
      : undefined;
  if (pick === undefined) return { text, status: "unavailable", remaining: 0 };

  lines.push({
    key: `gift:${gift.id}`,
    productId: gift.id,
    variantId: pick?.id ?? null,
    name: gift.name,
    variantLabel: pick ? `${pick.option_group}: ${pick.label}` : null,
    slug: gift.slug,
    image: imageRes.data?.[0]?.url ?? null,
    unitPrice: 0,
    qty: 1,
    lineTotal: 0,
    maxQty: null,
    free: true,
  });
  return { text, status: "applied", remaining: 0 };
}
