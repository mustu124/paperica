// Pure collection logic: which products a category/subcategory contains, plus listing
// filters and sorting. Works on the cached catalogue (lib/data/products.ts).

import type { CategoryNode, SubcategoryNode } from "./data/categories";
import type { Placement, ProductRow } from "./data/products";

export const PAGE_SIZE = 24;
export const UNDER_PRICE_LIMIT = 1000; // "Gifts Under ₹1,000"

export type Catalog = { products: ProductRow[]; placements: Placement[] };

function linkedTo(placements: Placement[], subIds: Set<string>) {
  const ids = new Set<string>();
  for (const p of placements) if (subIds.has(p.subcategoryId)) ids.add(p.productId);
  return ids;
}

/**
 * Product ids for one subcategory.
 *  manual / content_page  products linked to it
 *  filter_new             all products flagged is_new
 *  filter_best            all products flagged is_best_seller (manually curated)
 *  filter_under_1000      products in this category priced under ₹1,000
 *  filter_personalised    WhatsApp-mode products in this category
 *  view_all               union of the category's other subcategories
 * "In this category" = linked to any of the category's subcategories.
 */
export function resolveSubcategory(sub: SubcategoryNode, category: CategoryNode, catalog: Catalog): Set<string> {
  const { products, placements } = catalog;
  const inCategory = () =>
    linkedTo(placements, new Set(category.subcategories.map((s) => s.id)));

  switch (sub.kind) {
    case "manual":
    case "content_page":
      return linkedTo(placements, new Set([sub.id]));
    case "filter_new":
      return new Set(products.filter((p) => p.isNew).map((p) => p.id));
    case "filter_best":
      return new Set(products.filter((p) => p.isBestSeller).map((p) => p.id));
    case "filter_under_1000": {
      const ids = inCategory();
      return new Set(
        products.filter((p) => ids.has(p.id) && p.price != null && p.price < UNDER_PRICE_LIMIT).map((p) => p.id),
      );
    }
    case "filter_personalised": {
      const ids = inCategory();
      return new Set(products.filter((p) => ids.has(p.id) && p.mode === "whatsapp").map((p) => p.id));
    }
    case "view_all":
      return resolveCategory(category, catalog);
  }
}

/** Everything shown under a menu head ("View All"). */
export function resolveCategory(category: CategoryNode, catalog: Catalog): Set<string> {
  const all = new Set<string>();
  for (const sub of category.subcategories) {
    if (sub.kind === "view_all") continue;
    for (const id of resolveSubcategory(sub, category, catalog)) all.add(id);
  }
  return all;
}

// ---------------------------------------------------------------------------
// Filters & sorting (driven by URL search params)
// ---------------------------------------------------------------------------

export const SORTS = {
  featured: "Featured",
  "best-selling": "Best selling",
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low",
  newest: "Newest",
} as const;
export type SortKey = keyof typeof SORTS;

export type ListingParams = {
  sort: SortKey;
  min: number | null;
  max: number | null;
  inStock: boolean;
  type: "buy" | "whatsapp" | null;
  subs: string[]; // subcategory slugs
  page: number;
  q: string;
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => {
  if (v == null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export function parseListingParams(raw: RawParams): ListingParams {
  const sort = first(raw.sort);
  const type = first(raw.type);
  const subs = raw.sub == null ? [] : Array.isArray(raw.sub) ? raw.sub : [raw.sub];
  const page = Math.floor(num(first(raw.page)) ?? 1);
  return {
    sort: sort && sort in SORTS ? (sort as SortKey) : "featured",
    min: num(first(raw.min)),
    max: num(first(raw.max)),
    inStock: first(raw.in_stock) === "1",
    type: type === "buy" || type === "whatsapp" ? type : null,
    subs: subs.filter((s) => /^[a-z0-9-]+$/.test(s)).slice(0, 20),
    page: Math.min(Math.max(page, 1), 100),
    q: (first(raw.q) ?? "").trim().slice(0, 80),
  };
}

export function activeFilterCount(p: ListingParams) {
  return (p.min != null ? 1 : 0) + (p.max != null ? 1 : 0) + (p.inStock ? 1 : 0) + (p.type ? 1 : 0) + p.subs.length;
}

/** Builds a query string, dropping defaults. `overrides` replace values (null removes). */
export function listingQuery(p: ListingParams, overrides: Partial<Record<keyof ListingParams, unknown>> = {}) {
  const v = { ...p, ...overrides } as ListingParams;
  const qs = new URLSearchParams();
  if (v.q) qs.set("q", v.q);
  if (v.sort && v.sort !== "featured") qs.set("sort", v.sort);
  if (v.min != null) qs.set("min", String(v.min));
  if (v.max != null) qs.set("max", String(v.max));
  if (v.inStock) qs.set("in_stock", "1");
  if (v.type) qs.set("type", v.type);
  for (const s of v.subs ?? []) qs.append("sub", s);
  if (v.page && v.page > 1) qs.set("page", String(v.page));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function applyFilters(
  products: ProductRow[],
  p: ListingParams,
  subSets: Map<string, Set<string>>, // slug -> product ids, for the sub chips
): ProductRow[] {
  return products.filter((prod) => {
    if (p.min != null && (prod.price == null || prod.price < p.min)) return false;
    if (p.max != null && (prod.price == null || prod.price > p.max)) return false;
    if (p.inStock && !prod.inStock) return false;
    if (p.type && prod.mode !== p.type) return false;
    if (p.subs.length > 0 && !p.subs.some((slug) => subSets.get(slug)?.has(prod.id))) return false;
    return true;
  });
}

export function sortProducts(products: ProductRow[], sort: SortKey, sales: Record<string, number> = {}) {
  const featured = (a: ProductRow, b: ProductRow) =>
    a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt);
  const priced = (a: ProductRow, b: ProductRow, dir: 1 | -1) => {
    if (a.price == null && b.price == null) return featured(a, b);
    if (a.price == null) return 1; // "Enquire for price" goes last
    if (b.price == null) return -1;
    return (a.price - b.price) * dir || featured(a, b);
  };

  const list = [...products];
  switch (sort) {
    case "featured":
      return list.sort(featured);
    case "best-selling":
      return list.sort(
        (a, b) =>
          Number(b.isBestSeller) - Number(a.isBestSeller) ||
          (sales[b.id] ?? 0) - (sales[a.id] ?? 0) ||
          featured(a, b),
      );
    case "price-asc":
      return list.sort((a, b) => priced(a, b, 1));
    case "price-desc":
      return list.sort((a, b) => priced(a, b, -1));
    case "newest":
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || featured(a, b));
  }
}
