import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { activeOffers, countsTowards, offerTag } from "@/lib/offer";
import type { ProductMode } from "@/types/db";
import { getCategoryTree } from "./categories";
import { getSiteSettings } from "./settings";
import { getTodayInIndia } from "./today";
import { TAGS } from "./tags";

/** Lightweight product row used for listing, filtering and sorting (no images). */
export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  sku: string | null;
  price: number | null;
  compareAt: number | null;
  mode: ProductMode;
  isNew: boolean;
  isBestSeller: boolean;
  badgeText: string | null;
  inStock: boolean;
  /** Units left when stock is tracked; null = untracked. */
  stockQty: number | null;
  sortOrder: number;
  createdAt: string;
};

export type Placement = { productId: string; subcategoryId: string };

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  href: string;
  price: number | null;
  compareAt: number | null;
  mode: ProductMode;
  isNew: boolean;
  badgeText: string | null;
  soldOut: boolean;
  image: { url: string; alt: string } | null;
  hoverImage: { url: string; alt: string } | null;
  /** Has options (colour, ruling…), so it can't be added to the cart straight from a card. */
  hasOptions: boolean;
  maxQty: number | null;
  /** Corner tag when the product counts towards the free gift offer, e.g. "Buy 2 · Free gift". */
  offerTag: string | null;
};

export function productHref(slug: string) {
  return `/products/${slug}`;
}

const PAGE = 1000; // PostgREST's default max rows per request

/** Reads every row of a query in pages of 1000. */
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}

/**
 * All active products plus their subcategory placements. Collections, search and filters
 * are resolved from this in memory. Revalidates every 60s, or immediately when the admin
 * saves (tag "products").
 */
export async function getCatalog(): Promise<{ products: ProductRow[]; placements: Placement[] }> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 86400 });
  cacheTag(TAGS.products, TAGS.menu);

  const supabase = createPublicClient();
  try {
    const [rows, links] = await Promise.all([
      fetchAll((from, to) =>
        supabase
          .from("products")
          .select(
            "id, name, slug, short_description, sku, price_inr, compare_at_price_inr, mode, is_new, is_best_seller, badge_text, track_stock, stock_qty, sort_order, created_at",
          )
          .eq("is_active", true)
          .order("sort_order")
          .order("id")
          .range(from, to),
      ),
      fetchAll((from, to) =>
        supabase
          .from("product_subcategories")
          .select("product_id, subcategory_id")
          .order("product_id")
          .order("subcategory_id")
          .range(from, to),
      ),
    ]);

    return {
      products: rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        shortDescription: r.short_description,
        sku: r.sku,
        price: r.price_inr == null ? null : Number(r.price_inr),
        compareAt: r.compare_at_price_inr == null ? null : Number(r.compare_at_price_inr),
        mode: r.mode,
        isNew: r.is_new,
        isBestSeller: r.is_best_seller,
        badgeText: r.badge_text,
        inStock: r.mode === "whatsapp" || !r.track_stock || (r.stock_qty ?? 0) > 0,
        stockQty: r.track_stock ? (r.stock_qty ?? 0) : null,
        sortOrder: r.sort_order,
        createdAt: r.created_at,
      })),
      placements: links.map((l) => ({ productId: l.product_id, subcategoryId: l.subcategory_id })),
    };
  } catch (e) {
    console.error("[products] failed to load catalogue:", (e as Error).message);
    return { products: [], placements: [] };
  }
}

/** Card data (with first two images) for the given product ids, in the order given. */
export async function getProductCards(ids: string[]): Promise<ProductCardData[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 86400 });
  cacheTag(TAGS.products, TAGS.settings);

  if (ids.length === 0) return [];
  const [{ products, placements }, settings, tree, today] = await Promise.all([getCatalog(), getSiteSettings(), getCategoryTree(), getTodayInIndia()]);
  const offers = activeOffers(settings, today);
  const categoryOf = new Map(tree.flatMap((c) => c.subcategories.map((s) => [s.id, c.id] as const)));
  const offerFor = (r: ProductRow) => {
    if (offers.length === 0) return null;
    const subcategoryIds = placements.filter((pl) => pl.productId === r.id).map((pl) => pl.subcategoryId);
    const p = { ...r, subcategoryIds, categoryIds: subcategoryIds.flatMap((s) => categoryOf.get(s) ?? []) };
    return offers.find((o) => countsTowards(o, p)) ?? null;
  };
  const byId = new Map(products.map((p) => [p.id, p]));
  const rows = ids.flatMap((id) => byId.get(id) ?? []);

  const supabase = createPublicClient();
  const rowIds = rows.map((r) => r.id);
  const [{ data: images, error }, { data: variants, error: variantError }] = await Promise.all([
    supabase.from("product_images").select("product_id, url, alt, sort_order").in("product_id", rowIds).order("sort_order"),
    supabase.from("product_variants").select("product_id").in("product_id", rowIds),
  ]);
  if (error) console.error("[products] failed to load images:", error.message);
  if (variantError) console.error("[products] failed to load options:", variantError.message);
  const withOptions = new Set((variants ?? []).map((v) => v.product_id));

  return rows.map((r) => {
    const own = (images ?? []).filter((i) => i.product_id === r.id);
    const img = (i?: (typeof own)[number]) => (i ? { url: i.url, alt: i.alt || r.name } : null);
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      href: productHref(r.slug),
      price: r.price,
      compareAt: r.compareAt,
      mode: r.mode,
      isNew: r.isNew,
      badgeText: r.badgeText,
      soldOut: !r.inStock,
      image: img(own[0]),
      hoverImage: img(own[1]),
      // If options couldn't be loaded, send shoppers to the product page rather than guess.
      hasOptions: withOptions.has(r.id) || Boolean(variantError),
      maxQty: r.stockQty,
      offerTag: (() => {
        const o = offerFor(r);
        return o ? offerTag(o) : null;
      })(),
    };
  });
}

/** Active products by slug, in the order given (unknown/inactive slugs are skipped). */
export async function getProductCardsBySlugs(slugs: string[]): Promise<ProductCardData[]> {
  const { products } = await getCatalog();
  const bySlug = new Map(products.map((p) => [p.slug, p.id]));
  return getProductCards(slugs.flatMap((s) => bySlug.get(s) ?? []));
}

/** Active products marked New, most recently added first. */
export async function getNewProducts(limit = 8): Promise<ProductCardData[]> {
  const { products } = await getCatalog();
  const latest = products
    .filter((p) => p.isNew)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
  return getProductCards(latest.map((p) => p.id));
}

/** Case-insensitive match on name, short description and SKU (all words must match). */
export function matchProducts(products: ProductRow[], query: string): ProductRow[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return products.filter((p) => {
    const haystack = [p.name, p.shortDescription, p.sku].filter(Boolean).join(" ").toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}

/** Search used by the header suggestions. */
export async function searchProducts(query: string, limit = 5): Promise<ProductCardData[]> {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return [];
  const { products } = await getCatalog();
  return getProductCards(
    matchProducts(products, q)
      .slice(0, limit)
      .map((p) => p.id),
  );
}

/**
 * Units sold per product across paid orders (for "Best selling" sort). Orders are private,
 * so this reads them with the service role on the server and exposes only the totals.
 */
export async function getSalesCounts(): Promise<Record<string, number>> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products);

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return {};
  try {
    const supabase = createAdminClient();
    const paid = await fetchAll((from, to) =>
      supabase.from("orders").select("id").eq("payment_status", "paid").order("id").range(from, to),
    );
    const counts: Record<string, number> = {};
    const ids = paid.map((o) => o.id);
    for (let i = 0; i < ids.length; i += 200) {
      const { data, error } = await supabase
        .from("order_items")
        .select("product_id, qty")
        .in("order_id", ids.slice(i, i + 200));
      if (error) throw new Error(error.message);
      for (const item of data) {
        if (item.product_id) counts[item.product_id] = (counts[item.product_id] ?? 0) + item.qty;
      }
    }
    return counts;
  } catch (e) {
    console.error("[products] failed to load sales counts:", (e as Error).message);
    return {};
  }
}
