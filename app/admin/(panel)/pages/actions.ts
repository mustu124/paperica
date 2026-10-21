"use server";

import { z } from "zod";
import { friendlyError, NOT_AUTHORISED, requireAdmin, type ActionResult } from "@/lib/admin/auth";
import { EDITABLE_PAGES } from "@/lib/admin/tokens";
import { formConfig } from "@/lib/enquiry-forms";
import { refreshTags } from "@/lib/revalidate";

const html = z.string().max(100_000);
const empty = (s: string) => (s.trim() === "" || s === "<p></p>" ? "" : s);

const pageInput = z.object({
  title: z.string().trim().min(1, "Enter a title").max(150),
  body_html: html,
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  cta_label: z.string().trim().max(80),
  cta_whatsapp_message: z.string().max(2000),
  cta_email_subject: z.string().trim().max(150),
  /** Guided enquiry form; null leaves the stored form unchanged. */
  form_config: z.unknown().nullable().optional(),
});

export async function savePage(slug: string, input: z.input<typeof pageInput>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const page = EDITABLE_PAGES.find((p) => p.slug === slug && slug !== "about");
  if (!page) return { ok: false, error: "This page can't be edited here." };
  const parsed = pageInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const v = parsed.data;
  let form_config: z.infer<typeof formConfig> | undefined;
  if (page.enquiry && v.form_config != null) {
    const form = formConfig.safeParse(v.form_config);
    if (!form.success) return { ok: false, error: "Please check the form options." };
    form_config = form.data;
  }

  const { error } = await admin.supabase
    .from("pages")
    .update({
      title: v.title,
      body_html: empty(v.body_html),
      effective_date: v.effective_date,
      ...(page.enquiry
        ? {
            cta_label: v.cta_label || null,
            cta_whatsapp_message: v.cta_whatsapp_message.trim() ? v.cta_whatsapp_message : null,
            cta_email_subject: v.cta_email_subject || null,
            ...(form_config ? { form_config } : {}),
          }
        : {}),
    })
    .eq("slug", slug);
  if (error) return { ok: false, error: friendlyError(error) };
  refreshTags("pages");
  return { ok: true };
}

const aboutInput = z.object({
  title: z.string().trim().min(1, "Enter a title").max(150),
  about_intro_html: html,
  founder_story_html: html,
  mission_html: html,
  about_image_url: z.string().max(1000).refine((v) => v === "" || /^(\/|https:\/\/)/.test(v), "Upload the photo again."),
});

/** About: the title lives on pages.about; intro, story and mission are site settings. */
export async function saveAbout(input: z.input<typeof aboutInput>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const parsed = aboutInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const v = parsed.data;
  const { error: titleError } = await admin.supabase.from("pages").update({ title: v.title }).eq("slug", "about");
  if (titleError) return { ok: false, error: friendlyError(titleError) };
  const { error } = await admin.supabase.from("site_settings").upsert([
    { key: "about_intro_html", value: empty(v.about_intro_html) },
    { key: "founder_story_html", value: empty(v.founder_story_html) },
    { key: "mission_html", value: empty(v.mission_html) },
    { key: "about_image_url", value: v.about_image_url },
  ]);
  if (error) return { ok: false, error: friendlyError(error) };
  refreshTags("pages", "settings");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

const faqInput = z.object({
  group_name: z.string().trim().min(1, "Choose or type a group").max(80),
  question: z.string().trim().min(3, "Enter the question").max(300),
  answer_html: html.refine((s) => empty(s) !== "", "Enter the answer"),
  is_active: z.boolean(),
});

export async function saveFaq(id: string | null, input: z.input<typeof faqInput>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const parsed = faqInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const v = parsed.data;
  const { supabase } = admin;

  if (id) {
    const { error } = await supabase.from("faqs").update(v).eq("id", id);
    if (error) return { ok: false, error: friendlyError(error) };
  } else {
    // New question goes to the end of its group (or a new group at the end).
    const { data: all } = await supabase.from("faqs").select("group_name, sort_order").order("sort_order", { ascending: false });
    const inGroup = (all ?? []).find((f) => f.group_name === v.group_name);
    const sort_order = inGroup ? inGroup.sort_order + 1 : (all?.[0]?.sort_order ?? 0) + 100;
    const { error } = await supabase.from("faqs").insert({ ...v, sort_order });
    if (error) return { ok: false, error: friendlyError(error) };
  }
  refreshTags("faqs");
  return { ok: true };
}

export async function deleteFaq(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const { error } = await admin.supabase.from("faqs").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error) };
  refreshTags("faqs");
  return { ok: true };
}

/** Swaps a question with its neighbour inside the same group. */
export async function moveFaq(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const { supabase } = admin;
  const { data: faq } = await supabase.from("faqs").select("id, group_name, sort_order").eq("id", id).maybeSingle();
  if (!faq) return { ok: false, error: "Not found." };
  const { data: group } = await supabase.from("faqs").select("id, sort_order").eq("group_name", faq.group_name).order("sort_order");
  const list = group ?? [];
  const i = list.findIndex((f) => f.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return { ok: true };
  const a = list[i];
  const b = list[j];
  // Swap their positions (sort orders may be equal, so fall back to adjacent numbers).
  const [sa, sb] = a.sort_order === b.sort_order ? [b.sort_order + (j > i ? 1 : -1), a.sort_order] : [b.sort_order, a.sort_order];
  const r1 = await supabase.from("faqs").update({ sort_order: sa }).eq("id", a.id);
  const r2 = await supabase.from("faqs").update({ sort_order: sb }).eq("id", b.id);
  if (r1.error || r2.error) return { ok: false, error: friendlyError(r1.error ?? r2.error) };
  refreshTags("faqs");
  return { ok: true };
}
