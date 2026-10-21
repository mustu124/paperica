"use server";

import { z } from "zod";
import { friendlyError, NOT_AUTHORISED, requireAdmin, type ActionResult } from "@/lib/admin/auth";
import { slugify } from "@/lib/format";
import { refreshTags } from "@/lib/revalidate";

function refreshMenu() {
  refreshTags("menu", "products", "homepage");
}

const linkOrPath = z.string().trim().max(500).refine((v) => v === "" || /^(\/|https?:\/\/)/.test(v), "Links must start with / or https://");

const categoryInput = z.object({
  name: z.string().trim().min(1, "Enter a name").max(60),
  show_in_menu: z.boolean(),
  description: z.string().trim().max(500),
  image_url: z.string().max(1000).nullable(),
  menu_feature_images: z
    .array(z.object({ url: z.string().max(1000), alt: z.string().trim().max(200), label: z.string().trim().max(80), link_url: linkOrPath }))
    .max(2),
});

/** Rename / show-hide / description / images for a menu head. (Heads can't be created or deleted.) */
export async function saveCategory(id: string, input: z.input<typeof categoryInput>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const parsed = categoryInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const v = parsed.data;
  const { error } = await admin.supabase
    .from("categories")
    .update({
      name: v.name,
      show_in_menu: v.show_in_menu,
      description: v.description || null,
      image_url: v.image_url,
      menu_feature_images: v.menu_feature_images.filter((m) => m.url),
    })
    .eq("id", id);
  if (error) return { ok: false, error: friendlyError(error) };
  refreshMenu();
  return { ok: true };
}

async function reorder(table: "categories" | "subcategories", ids: string[], id: string, direction: "up" | "down") {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const i = ids.indexOf(id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return { ok: true } as const;
  const next = [...ids];
  [next[i], next[j]] = [next[j], next[i]];
  for (const [k, rowId] of next.entries()) {
    const { error } = await admin.supabase.from(table).update({ sort_order: k + 1 }).eq("id", rowId);
    if (error) return { ok: false, error: friendlyError(error) } as const;
  }
  refreshMenu();
  return { ok: true } as const;
}

export async function moveCategory(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const { data } = await admin.supabase.from("categories").select("id").order("sort_order");
  return reorder("categories", (data ?? []).map((c) => c.id), id, direction);
}

export async function moveSubcategory(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const { data: sub } = await admin.supabase.from("subcategories").select("category_id").eq("id", id).maybeSingle();
  if (!sub) return { ok: false, error: "Not found." };
  const { data } = await admin.supabase.from("subcategories").select("id").eq("category_id", sub.category_id).order("sort_order");
  return reorder("subcategories", (data ?? []).map((s) => s.id), id, direction);
}

const subInput = z.object({
  name: z.string().trim().min(1, "Enter a name").max(60),
  description: z.string().trim().max(500),
  /** Omitted = leave unchanged (also keeps saving working before the gift-sets migration). */
  footer_note: z.string().trim().max(2000).optional(),
});

export async function saveSubcategory(id: string, input: z.input<typeof subInput>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const parsed = subInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const { error } = await admin.supabase
    .from("subcategories")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      ...(parsed.data.footer_note !== undefined ? { footer_note: parsed.data.footer_note || null } : {}),
    })
    .eq("id", id);
  if (error) return { ok: false, error: friendlyError(error) };
  refreshMenu();
  return { ok: true };
}

/** Adds a normal (hand-picked products) subcategory at the end of a head. */
export async function addSubcategory(categoryId: string, name: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const parsed = subInput.shape.name.safeParse(name);
  if (!parsed.success) return { ok: false, error: "Enter a name for the new subcategory." };
  const slug = slugify(parsed.data);
  if (!slug || slug === "view-all") return { ok: false, error: "Please choose a different name." };
  const { data: last } = await admin.supabase
    .from("subcategories")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const { error } = await admin.supabase
    .from("subcategories")
    .insert({ category_id: categoryId, name: parsed.data, slug, kind: "manual", sort_order: (last?.[0]?.sort_order ?? 0) + 1 });
  if (error) return { ok: false, error: friendlyError(error) };
  refreshMenu();
  return { ok: true };
}

/** Deletes a hand-picked subcategory (products stay; they're just unlinked from it). */
export async function deleteSubcategory(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const { data: sub } = await admin.supabase.from("subcategories").select("kind").eq("id", id).maybeSingle();
  if (!sub) return { ok: false, error: "Not found." };
  if (sub.kind !== "manual") return { ok: false, error: "This subcategory is part of the shop's structure and can't be deleted." };
  const { error } = await admin.supabase.from("subcategories").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error) };
  refreshMenu();
  return { ok: true };
}
