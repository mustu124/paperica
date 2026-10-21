import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { SubcategoryKind } from "@/types/db";
import { categoryHref, subcategoryHref } from "./menu";
import { TAGS } from "./tags";

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** Note at the bottom of the head's page (e.g. GIFTS → "A little note before you order"). */
  footerNote: string | null;
  href: string;
  subcategories: SubcategoryNode[];
};

export type SubcategoryNode = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  kind: SubcategoryKind;
  description: string | null;
  /** Note at the bottom of the collection page (e.g. Gift Sets → "A little note before you order"). */
  footerNote: string | null;
  /** Menu item that opens another page (e.g. a gift set's product page) instead of a collection. */
  linkUrl: string | null;
  href: string;
};

/** Every category (including ones hidden from the menu) with its subcategories. */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 86400 });
  cacheTag(TAGS.menu);

  const supabase = createPublicClient();
  const [cats, subs] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("subcategories")
      // "*" so the tree still loads on a database without the footer_note column yet.
      .select("*")
      .order("sort_order"),
  ]);
  if (cats.error || subs.error) {
    console.error("[categories] failed to load:", (cats.error ?? subs.error)?.message);
    return [];
  }

  return cats.data.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    footerNote: c.footer_note ?? null,
    href: categoryHref(c.slug),
    subcategories: subs.data
      .filter((s) => s.category_id === c.id)
      .map((s) => ({
        id: s.id,
        categoryId: s.category_id,
        name: s.name,
        slug: s.slug,
        kind: s.kind,
        description: s.description,
        footerNote: s.footer_note ?? null,
        linkUrl: s.link_url ?? null,
        href: subcategoryHref(c.slug, s),
      })),
  }));
}

/** Looks up a category and (optionally) one of its subcategories by slug. */
export async function getCollectionNodes(categorySlug: string, subcategorySlug?: string) {
  const tree = await getCategoryTree();
  const category = tree.find((c) => c.slug === categorySlug);
  if (!category) return null;
  if (!subcategorySlug) return { category, subcategory: null };
  const subcategory = category.subcategories.find((s) => s.slug === subcategorySlug);
  // "view-all" as a path segment is the same page as the category root.
  if (!subcategory || subcategory.kind === "view_all") return null;
  return { category, subcategory };
}
