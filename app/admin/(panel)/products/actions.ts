"use server";

import { z } from "zod";
import { friendlyError, NOT_AUTHORISED, requireAdmin, type ActionResult } from "@/lib/admin/auth";
import { slugify } from "@/lib/format";
import { refreshTags } from "@/lib/revalidate";
import { loadProduct } from "./load";

const money = z.number().nonnegative().max(10_000_000).nullable();

const productInput = z.object({
  name: z.string().trim().min(1, "Enter a product name").max(200),
  slug: z.string().trim().max(200),
  short_description: z.string().trim().max(500),
  description_html: z.string().max(50_000),
  details_html: z.string().max(50_000),
  price_inr: money,
  compare_at_price_inr: money,
  sku: z.string().trim().max(60),
  track_stock: z.boolean(),
  stock_qty: z.number().int().min(0).max(1_000_000).nullable(),
  mode: z.enum(["buy", "whatsapp"]),
  badge_text: z.string().trim().max(40),
  is_new: z.boolean(),
  is_best_seller: z.boolean(),
  low_stock_message: z.string().trim().max(200),
  is_active: z.boolean(),
  subcategory_ids: z.array(z.uuid()).max(50),
  variants: z
    .array(
      z.object({
        id: z.uuid().nullable(),
        label: z.string().trim().min(1, "Every option needs a label").max(80),
        option_group: z.string().trim().min(1).max(40),
        price_override: money,
        stock_qty: z.number().int().min(0).max(1_000_000).nullable(),
      }),
    )
    .max(50),
  images: z
    .array(z.object({ id: z.uuid().nullable(), url: z.url().or(z.string().startsWith("/")), alt: z.string().trim().max(200) }))
    .max(30),
  /** Gift set contents; empty for ordinary products. */
  bundle_items: z
    .array(
      z.object({
        label: z.string().trim().min(1, "Name every item in the gift set").max(80),
        subcategory_id: z.uuid("Choose where each gift-set item comes from"),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .max(20),
});

export type ProductInput = z.input<typeof productInput>;

const MEDIA_PREFIX = "/storage/v1/object/public/media/";
type Supabase = NonNullable<Awaited<ReturnType<typeof requireAdmin>>>["supabase"];

/** Removes uploaded files from Storage (only files in our media bucket). */
async function removeFiles(supabase: Supabase, urls: string[]) {
  const paths = urls.flatMap((u) => {
    const i = u.indexOf(MEDIA_PREFIX);
    return i >= 0 ? [decodeURIComponent(u.slice(i + MEDIA_PREFIX.length))] : [];
  });
  if (paths.length) await supabase.storage.from("media").remove(paths);
}

function refreshCatalog() {
  refreshTags("products", "menu", "homepage");
}

export async function saveProduct(
  id: string | null,
  input: ProductInput,
): Promise<ActionResult<{ id: string; product: ProductInput | null }>> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const parsed = productInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const v = parsed.data;
  const { supabase } = admin;

  if (v.mode === "buy" && v.price_inr == null) {
    return { ok: false, error: "Products sold online need a price. Only “Customise on WhatsApp” products can leave it empty." };
  }
  // PERSONALISED (default_mode = whatsapp) products must use WhatsApp mode — say so clearly
  // instead of letting the database switch the mode silently.
  if (v.mode === "buy" && v.subcategory_ids.length) {
    const { data: subs } = await supabase.from("subcategories").select("id, category_id").in("id", v.subcategory_ids);
    const catIds = [...new Set((subs ?? []).map((s) => s.category_id))];
    const { data: cats } = await supabase.from("categories").select("name, default_mode").in("id", catIds);
    const wa = (cats ?? []).find((c) => c.default_mode === "whatsapp");
    if (wa) return { ok: false, error: `Products in ${wa.name} must use “Customise on WhatsApp”. Change the mode or untick ${wa.name}.` };
  }

  const fields = {
    name: v.name,
    slug: slugify(v.slug || v.name),
    short_description: v.short_description || null,
    description_html: v.description_html.trim() && v.description_html !== "<p></p>" ? v.description_html : null,
    details_html: v.details_html.trim() && v.details_html !== "<p></p>" ? v.details_html : null,
    price_inr: v.price_inr,
    compare_at_price_inr: v.compare_at_price_inr,
    sku: v.sku || null,
    track_stock: v.track_stock,
    stock_qty: v.track_stock ? (v.stock_qty ?? 0) : v.stock_qty,
    mode: v.mode,
    badge_text: v.badge_text || null,
    is_new: v.is_new,
    is_best_seller: v.is_best_seller,
    low_stock_message: v.low_stock_message || null,
    is_active: v.is_active,
  };
  if (!fields.slug) return { ok: false, error: "Enter a name or URL slug." };

  let productId = id;
  if (productId) {
    // Placements first, so switching a product out of PERSONALISED back to "buy" works.
    const { error: delErr } = await supabase
      .from("product_subcategories")
      .delete()
      .eq("product_id", productId)
      .not("subcategory_id", "in", `(${v.subcategory_ids.join(",") || "00000000-0000-0000-0000-000000000000"})`);
    if (delErr) return { ok: false, error: friendlyError(delErr) };
    const { error } = await supabase.from("products").update(fields).eq("id", productId);
    if (error) return { ok: false, error: friendlyError(error) };
  } else {
    const { data, error } = await supabase.from("products").insert(fields).select("id").single();
    if (error || !data) return { ok: false, error: friendlyError(error) };
    productId = data.id;
  }

  // Placements (insert any new ones).
  if (v.subcategory_ids.length) {
    const { data: existing } = await supabase.from("product_subcategories").select("subcategory_id").eq("product_id", productId);
    const have = new Set((existing ?? []).map((e) => e.subcategory_id));
    const add = v.subcategory_ids.filter((s) => !have.has(s)).map((s) => ({ product_id: productId as string, subcategory_id: s }));
    if (add.length) {
      const { error } = await supabase.from("product_subcategories").insert(add);
      if (error) return { ok: false, error: friendlyError(error) };
    }
  }

  // Variants: delete removed, update kept, insert new.
  const { data: oldVariants } = await supabase.from("product_variants").select("id").eq("product_id", productId);
  const keepVariantIds = new Set(v.variants.flatMap((x) => (x.id ? [x.id] : [])));
  const removeVariants = (oldVariants ?? []).filter((x) => !keepVariantIds.has(x.id)).map((x) => x.id);
  if (removeVariants.length) await supabase.from("product_variants").delete().in("id", removeVariants);
  for (const [i, variant] of v.variants.entries()) {
    const row = {
      product_id: productId,
      label: variant.label,
      option_group: variant.option_group,
      price_override: variant.price_override,
      stock_qty: variant.stock_qty,
      sort_order: i,
    };
    const { error } = variant.id
      ? await supabase.from("product_variants").update(row).eq("id", variant.id).eq("product_id", productId)
      : await supabase.from("product_variants").insert(row);
    if (error) return { ok: false, error: friendlyError(error) };
  }

  // Gift set contents: replace the list (the database then recalculates the set's stock).
  const { data: oldBundle, error: bundleReadError } = await supabase.from("product_bundle_items").select("id").eq("bundle_id", productId);
  if (bundleReadError && v.bundle_items.length) return { ok: false, error: friendlyError(bundleReadError) };
  if (!bundleReadError && (oldBundle?.length || v.bundle_items.length)) {
    const { error: delBundleError } = await supabase.from("product_bundle_items").delete().eq("bundle_id", productId);
    if (delBundleError) return { ok: false, error: friendlyError(delBundleError) };
    if (v.bundle_items.length) {
      const { error } = await supabase
        .from("product_bundle_items")
        .insert(v.bundle_items.map((b, i) => ({ bundle_id: productId as string, subcategory_id: b.subcategory_id, label: b.label, qty: b.qty, sort_order: i })));
      if (error) return { ok: false, error: friendlyError(error) };
    }
  }

  // Images: delete removed (and their files), update order/alt, insert new.
  const { data: oldImages } = await supabase.from("product_images").select("id, url").eq("product_id", productId);
  const keepImageIds = new Set(v.images.flatMap((x) => (x.id ? [x.id] : [])));
  const removedImages = (oldImages ?? []).filter((x) => !keepImageIds.has(x.id));
  if (removedImages.length) {
    await supabase.from("product_images").delete().in("id", removedImages.map((x) => x.id));
    const stillUsed = new Set(v.images.map((x) => x.url));
    await removeFiles(supabase, removedImages.map((x) => x.url).filter((u) => !stillUsed.has(u)));
  }
  for (const [i, image] of v.images.entries()) {
    const row = { product_id: productId, url: image.url, alt: image.alt, sort_order: i };
    const { error } = image.id
      ? await supabase.from("product_images").update(row).eq("id", image.id).eq("product_id", productId)
      : await supabase.from("product_images").insert(row);
    if (error) return { ok: false, error: friendlyError(error) };
  }

  refreshCatalog();
  // Return the saved state (with new image/option ids) so the form can resync.
  return { ok: true, data: { id: productId, product: await loadProduct(supabase, productId) } };
}

/** Deletes a product — or, if it appears in past orders, only deactivates it. */
export async function deleteProduct(id: string): Promise<ActionResult<{ deactivated: boolean }>> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const { supabase } = admin;

  const { data: used } = await supabase.from("order_items").select("id").eq("product_id", id).limit(1);
  if (used && used.length > 0) {
    const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
    if (error) return { ok: false, error: friendlyError(error) };
    refreshCatalog();
    return { ok: true, data: { deactivated: true } };
  }

  const { data: images } = await supabase.from("product_images").select("url").eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error) };
  await removeFiles(supabase, (images ?? []).map((i) => i.url));
  refreshCatalog();
  return { ok: true, data: { deactivated: false } };
}

/** Copies a product (inactive, "(Copy)" name, new slug) with its images, options and categories. */
export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const { supabase } = admin;

  const { data: p } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!p) return { ok: false, error: "Product not found." };
  const suffix = Math.random().toString(36).slice(2, 6);
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = p;
  void _id;
  void _c;
  void _u;
  const { data: copy, error } = await supabase
    .from("products")
    .insert({ ...rest, name: `${p.name} (Copy)`, slug: `${p.slug}-copy-${suffix}`, sku: null, is_active: false })
    .select("id")
    .single();
  if (error || !copy) return { ok: false, error: friendlyError(error) };

  const [{ data: images }, { data: variants }, { data: links }, { data: bundle }] = await Promise.all([
    supabase.from("product_images").select("url, alt, sort_order").eq("product_id", id),
    supabase.from("product_variants").select("label, option_group, price_override, stock_qty, sort_order").eq("product_id", id),
    supabase.from("product_subcategories").select("subcategory_id").eq("product_id", id),
    supabase.from("product_bundle_items").select("subcategory_id, label, qty, sort_order").eq("bundle_id", id),
  ]);
  if (images?.length) await supabase.from("product_images").insert(images.map((i) => ({ ...i, product_id: copy.id })));
  if (variants?.length) await supabase.from("product_variants").insert(variants.map((x) => ({ ...x, product_id: copy.id })));
  if (links?.length) await supabase.from("product_subcategories").insert(links.map((l) => ({ ...l, product_id: copy.id })));
  if (bundle?.length) await supabase.from("product_bundle_items").insert(bundle.map((b) => ({ ...b, bundle_id: copy.id })));

  refreshCatalog();
  return { ok: true, data: { id: copy.id } };
}

const bulkPatch = z
  .object({ is_active: z.boolean(), is_new: z.boolean(), is_best_seller: z.boolean() })
  .partial()
  .refine((p) => Object.keys(p).length > 0);

/** Activate/deactivate, mark New, mark Best Seller for several products at once. */
export async function bulkUpdateProducts(ids: string[], patch: z.input<typeof bulkPatch>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const parsedIds = z.array(z.uuid()).min(1).max(500).safeParse(ids);
  const parsedPatch = bulkPatch.safeParse(patch);
  if (!parsedIds.success || !parsedPatch.success) return { ok: false, error: "Nothing to update." };
  const { error } = await admin.supabase.from("products").update(parsedPatch.data).in("id", parsedIds.data);
  if (error) return { ok: false, error: friendlyError(error) };
  refreshCatalog();
  return { ok: true };
}
