import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/types/db";
import { getCategoryTree, type CategoryNode, type SubcategoryNode } from "./categories";
import { getCatalog, getProductCards, type ProductCardData } from "./products";
import { TAGS } from "./tags";

export type ProductDetail = Tables<"products"> & {
  images: { url: string; alt: string }[];
  variants: Tables<"product_variants">[];
  /** Where the product sits in the menu (first placement), for breadcrumbs + related items. */
  primary: { category: CategoryNode; subcategory: SubcategoryNode } | null;
  subcategoryIds: string[];
};

/** Full product for the product page (active products only, via RLS). Tagged "products". */
export async function getProduct(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 86400 });
  cacheTag(TAGS.products);

  const supabase = createPublicClient();
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) console.error(`[product] failed to load "${slug}":`, error.message);
  if (!product) return null;

  const [images, variants, links, tree] = await Promise.all([
    supabase.from("product_images").select("url, alt, sort_order").eq("product_id", product.id).order("sort_order"),
    supabase.from("product_variants").select("*").eq("product_id", product.id).order("sort_order"),
    supabase.from("product_subcategories").select("subcategory_id").eq("product_id", product.id),
    getCategoryTree(),
  ]);

  const subcategoryIds = (links.data ?? []).map((l) => l.subcategory_id);
  // First placement in menu order (category order, then subcategory order).
  let primary: ProductDetail["primary"] = null;
  for (const category of tree) {
    const sub = category.subcategories.find((s) => subcategoryIds.includes(s.id));
    if (sub) {
      primary = { category, subcategory: sub };
      break;
    }
  }

  return {
    ...product,
    images: (images.data ?? []).map((i) => ({ url: i.url, alt: i.alt || product.name })),
    variants: variants.data ?? [],
    primary,
    subcategoryIds,
  };
}

/** "You may also like": products sharing a subcategory, then the same category; newest first. */
export async function getRelatedProducts(product: ProductDetail, limit = 8): Promise<ProductCardData[]> {
  const { products, placements } = await getCatalog();
  const sameSub = new Set(
    placements.filter((p) => product.subcategoryIds.includes(p.subcategoryId)).map((p) => p.productId),
  );
  const categorySubIds = new Set(product.primary?.category.subcategories.map((s) => s.id) ?? []);
  const sameCategory = new Set(
    placements.filter((p) => categorySubIds.has(p.subcategoryId)).map((p) => p.productId),
  );

  const ranked = products
    .filter((p) => p.id !== product.id && (sameSub.has(p.id) || sameCategory.has(p.id)))
    .sort(
      (a, b) =>
        Number(sameSub.has(b.id)) - Number(sameSub.has(a.id)) ||
        Number(b.inStock) - Number(a.inStock) ||
        b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, limit);
  return getProductCards(ranked.map((p) => p.id));
}
