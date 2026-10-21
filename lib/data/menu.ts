import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { MenuFeatureImage, SubcategoryKind } from "@/types/db";
import { TAGS } from "./tags";

export type MenuSubcategory = {
  id: string;
  name: string;
  slug: string;
  kind: SubcategoryKind;
  href: string;
  /** Picture shown when the item is hovered: the main photo of its first product. */
  image: { url: string; alt: string } | null;
};

export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  href: string;
  image: string | null;
  featureImages: MenuFeatureImage[];
  subcategories: MenuSubcategory[];
};

export function categoryHref(categorySlug: string) {
  return `/collections/${categorySlug}`;
}

/**
 * View All → the category; content pages (Corporate Gifting, Custom Orders) → their own page;
 * items with a link (e.g. a gift set) → that page.
 */
export function subcategoryHref(categorySlug: string, sub: { slug: string; kind: SubcategoryKind; link_url?: string | null }) {
  if (sub.link_url) return sub.link_url;
  if (sub.kind === "view_all") return categoryHref(categorySlug);
  if (sub.kind === "content_page") return `/${sub.slug}`;
  return `/collections/${categorySlug}/${sub.slug}`;
}

/** Menu heads (show_in_menu) with their subcategories, in sort order. Cached; tagged "menu". */
export async function getMenu(): Promise<MenuCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.menu, TAGS.products);

  const supabase = createPublicClient();
  const [cats, subs, previews] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, sort_order, image_url, menu_feature_images")
      .eq("show_in_menu", true)
      .order("sort_order"),
    // "*" so the menu still loads on a database without the link_url column yet.
    supabase.from("subcategories").select("*").order("sort_order"),
    subcategoryPreviews(),
  ]);

  if (cats.error || subs.error) {
    console.error("[menu] failed to load categories:", (cats.error ?? subs.error)?.message);
    return [];
  }

  return cats.data.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    href: categoryHref(c.slug),
    image: c.image_url,
    featureImages: Array.isArray(c.menu_feature_images)
      ? c.menu_feature_images.filter((img) => img && typeof img.url === "string").slice(0, 3)
      : [],
    subcategories: subs.data
      .filter((s) => s.category_id === c.id)
      .map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        kind: s.kind,
        href: subcategoryHref(c.slug, s),
        image: previews.get(s.id) ?? null,
      })),
  }));
}

/** subcategory id → main photo of its first active product (menu sort order). Never throws. */
async function subcategoryPreviews(): Promise<Map<string, { url: string; alt: string }>> {
  const supabase = createPublicClient(); // RLS: active products only
  const [links, products, images] = await Promise.all([
    supabase.from("product_subcategories").select("product_id, subcategory_id"),
    supabase.from("products").select("id, name, sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("product_images").select("product_id, url, alt, sort_order").order("sort_order"),
  ]);
  const out = new Map<string, { url: string; alt: string }>();
  if (links.error || products.error || images.error) return out;
  const firstImage = new Map<string, { url: string; alt: string }>();
  const names = new Map(products.data.map((p) => [p.id, p.name]));
  for (const i of images.data) {
    if (!firstImage.has(i.product_id)) firstImage.set(i.product_id, { url: i.url, alt: i.alt || names.get(i.product_id) || "" });
  }
  const order = new Map(products.data.map((p, i) => [p.id, i]));
  const bySub = new Map<string, string[]>();
  for (const l of links.data) {
    if (!order.has(l.product_id) || !firstImage.has(l.product_id)) continue;
    bySub.set(l.subcategory_id, [...(bySub.get(l.subcategory_id) ?? []), l.product_id]);
  }
  for (const [sub, ids] of bySub) {
    ids.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
    out.set(sub, firstImage.get(ids[0])!);
  }
  return out;
}
