import "server-only";
import type { requireAdmin } from "@/lib/admin/auth";
import type { ProductInput } from "./actions";
import type { CategoryOption } from "./product-form";

type Supabase = NonNullable<Awaited<ReturnType<typeof requireAdmin>>>["supabase"];

export const EMPTY_PRODUCT: ProductInput = {
  name: "",
  slug: "",
  short_description: "",
  description_html: "",
  details_html: "",
  price_inr: null,
  compare_at_price_inr: null,
  sku: "",
  track_stock: true,
  stock_qty: 0,
  mode: "buy",
  badge_text: "",
  is_new: true,
  is_best_seller: false,
  low_stock_message: "",
  is_active: true,
  subcategory_ids: [],
  variants: [],
  images: [],
  bundle_items: [],
};

export async function loadCategoryOptions(supabase: Supabase): Promise<CategoryOption[]> {
  const [{ data: cats }, { data: subs }] = await Promise.all([
    supabase.from("categories").select("id, name, default_mode, sort_order").order("sort_order"),
    supabase.from("subcategories").select("id, category_id, name, kind, sort_order").order("sort_order"),
  ]);
  return (cats ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    defaultMode: c.default_mode,
    subcategories: (subs ?? []).filter((s) => s.category_id === c.id).map((s) => ({ id: s.id, name: s.name, kind: s.kind })),
  }));
}

export async function loadProduct(supabase: Supabase, id: string): Promise<ProductInput | null> {
  const [{ data: p }, { data: images }, { data: variants }, { data: links }, { data: bundle }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("product_images").select("id, url, alt, sort_order").eq("product_id", id).order("sort_order"),
    supabase.from("product_variants").select("*").eq("product_id", id).order("sort_order"),
    supabase.from("product_subcategories").select("subcategory_id").eq("product_id", id),
    // Empty (not an error) on a database without the gift-sets migration.
    supabase.from("product_bundle_items").select("label, subcategory_id, qty").eq("bundle_id", id).order("sort_order"),
  ]);
  if (!p) return null;
  const num = (v: number | string | null) => (v == null ? null : Number(v));
  return {
    name: p.name,
    slug: p.slug,
    short_description: p.short_description ?? "",
    description_html: p.description_html ?? "",
    details_html: p.details_html ?? "",
    price_inr: num(p.price_inr),
    compare_at_price_inr: num(p.compare_at_price_inr),
    sku: p.sku ?? "",
    track_stock: p.track_stock,
    stock_qty: p.stock_qty,
    mode: p.mode,
    badge_text: p.badge_text ?? "",
    is_new: p.is_new,
    is_best_seller: p.is_best_seller,
    low_stock_message: p.low_stock_message ?? "",
    is_active: p.is_active,
    subcategory_ids: (links ?? []).map((l) => l.subcategory_id),
    variants: (variants ?? []).map((x) => ({
      id: x.id,
      label: x.label,
      option_group: x.option_group,
      price_override: num(x.price_override),
      stock_qty: x.stock_qty,
    })),
    images: (images ?? []).map((i) => ({ id: i.id, url: i.url, alt: i.alt })),
    bundle_items: (bundle ?? []).map((b) => ({ label: b.label, subcategory_id: b.subcategory_id, qty: b.qty })),
  };
}
