"use server";

import { z } from "zod";
import { friendlyError, NOT_AUTHORISED, requireAdmin, type ActionResult } from "@/lib/admin/auth";
import { SECTION_SPECS } from "@/lib/admin/homepage-specs";
import { refreshTags } from "@/lib/revalidate";
import type { HomepageSectionType, Json } from "@/types/db";

function refreshHomepage() {
  refreshTags("homepage", "settings");
}

export async function setSectionActive(id: string, active: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const { error } = await admin.supabase.from("homepage_sections").update({ is_active: active }).eq("id", id);
  if (error) return { ok: false, error: friendlyError(error) };
  refreshHomepage();
  return { ok: true };
}

/** Moves a section up or down by swapping sort_order with its neighbour (info strip excluded). */
export async function moveSection(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const { data: sections } = await admin.supabase.from("homepage_sections").select("id, type, sort_order").order("sort_order");
  const list = (sections ?? []).filter((s) => SECTION_SPECS[s.type].reorderable);
  const i = list.findIndex((s) => s.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  // Renumber everything (10, 20, ...) with the two swapped, so equal sort_orders can't stick.
  [list[i], list[j]] = [list[j], list[i]];
  for (const [k, s] of list.entries()) {
    const { error } = await admin.supabase.from("homepage_sections").update({ sort_order: (k + 1) * 10 }).eq("id", s.id);
    if (error) return { ok: false, error: friendlyError(error) };
  }
  refreshHomepage();
  return { ok: true };
}

const text = z.string().trim().max(500);
const sectionInput = z.object({
  config: z.record(z.string(), z.unknown()),
  slots: z
    .array(
      z.object({
        images: z.array(z.object({ url: z.string().max(1000).nullable(), alt: text })).max(2),
        fields: z.object({
          heading: text.optional(),
          subheading: text.optional(),
          button_label: text.optional(),
          link_url: z.string().trim().max(1000).optional(),
          badge_text: text.optional(),
        }),
      }),
    )
    .max(12),
  settings: z.record(z.string(), z.union([z.string().max(2000), z.number()])),
});

export type SectionInput = z.input<typeof sectionInput>;

/** Replaces a section's assets, config and related settings in one save. */
export async function saveSection(id: string, type: HomepageSectionType, input: SectionInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const parsed = sectionInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const spec = SECTION_SPECS[type];
  const { config, slots, settings } = parsed.data;
  const { supabase } = admin;

  for (const slot of slots) {
    const link = slot.fields.link_url;
    if (link && !/^(\/|https?:\/\/|mailto:|tel:)/.test(link))
      return { ok: false, error: `“${link}” isn't a valid link. Start with / for pages in the shop, or https://.` };
  }
  for (const [key, value] of Object.entries(config)) {
    if (key.endsWith("_url") && typeof value === "string" && value.trim() && !/^(\/|https?:\/\/)/.test(value.trim()))
      return { ok: false, error: `“${value}” isn't a valid link. Start with / for pages in the shop, or https://.` };
  }

  // Assets: one row per image (or one text-only row when the section has no images).
  const rows = slots.flatMap((slot, i) => {
    const count = Math.max(spec.images.length, 1);
    return Array.from({ length: count }, (_, j) => {
      const img = slot.images[j];
      const base = { section_id: id, slot: i, sort_order: j, image_url: img?.url || null, image_alt: img?.alt ?? "" };
      if (j > 0) return base;
      const f = slot.fields;
      return {
        ...base,
        heading: f.heading || null,
        subheading: f.subheading || null,
        button_label: f.button_label || null,
        link_url: f.link_url || null,
        badge_text: f.badge_text || null,
      };
    }).filter((row) => row.sort_order === 0 || row.image_url); // skip empty image-B rows
  });

  const { error: delError } = await supabase.from("homepage_assets").delete().eq("section_id", id);
  if (delError) return { ok: false, error: friendlyError(delError) };
  // Something has been written from here on: refresh the storefront even if a later step fails.
  refreshHomepage();
  if (rows.length) {
    const { error } = await supabase.from("homepage_assets").insert(rows);
    if (error) return { ok: false, error: friendlyError(error) };
  }

  const { error: cfgError } = await supabase.from("homepage_sections").update({ config: config as Json }).eq("id", id);
  if (cfgError) return { ok: false, error: friendlyError(cfgError) };

  for (const field of spec.settings ?? []) {
    if (!(field.key in settings)) continue;
    const value = settings[field.key];
    const { error } = await supabase.from("site_settings").upsert({ key: field.key, value: value as Json });
    if (error) return { ok: false, error: friendlyError(error) };
  }

  refreshHomepage();
  return { ok: true };
}
