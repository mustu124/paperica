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

/** View All → the category; content pages (Corporate Gifting, Custom Orders) → their own page. */
export function subcategoryHref(categorySlug: string, sub: { slug: string; kind: SubcategoryKind }) {
  if (sub.kind === "view_all") return categoryHref(categorySlug);
  if (sub.kind === "content_page") return `/${sub.slug}`;
  return `/collections/${categorySlug}/${sub.slug}`;
}

/** Menu heads (show_in_menu) with their subcategories, in sort order. Cached; tagged "menu". */
export async function getMenu(): Promise<MenuCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.menu);

  const supabase = createPublicClient();
  const [cats, subs] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, sort_order, image_url, menu_feature_images")
      .eq("show_in_menu", true)
      .order("sort_order"),
    supabase.from("subcategories").select("id, category_id, name, slug, kind, sort_order").order("sort_order"),
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
      ? c.menu_feature_images.filter((img) => img && typeof img.url === "string").slice(0, 2)
      : [],
    subcategories: subs.data
      .filter((s) => s.category_id === c.id)
      .map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        kind: s.kind,
        href: subcategoryHref(c.slug, s),
      })),
  }));
}
