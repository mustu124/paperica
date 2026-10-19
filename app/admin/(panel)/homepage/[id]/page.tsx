import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";
import { SECTION_SPECS, slotCount } from "@/lib/admin/homepage-specs";
import { subcategoryHref } from "@/lib/data/menu";
import { SectionEditor, type EditorSlot } from "./section-editor";

export const metadata: Metadata = { title: "Edit homepage section" };

type Props = { params: Promise<{ id: string }> };

export default function SectionPage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] w-full" />}>
      <Section params={params} />
    </Suspense>
  );
}

const PAGE_PATHS: Record<string, string> = {
  about: "/about",
  contact: "/contact",
  faq: "/faq",
  "corporate-gifting": "/corporate-gifting",
  "custom-orders": "/custom-orders",
  "shipping-policy": "/shipping-policy",
};

async function Section({ params }: Props) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return null;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase } = admin;

  const [{ data: section }, { data: assets }, { data: cats }, { data: subs }, { data: pages }, { data: products }, { data: settings }] =
    await Promise.all([
      supabase.from("homepage_sections").select("*").eq("id", id).maybeSingle(),
      supabase.from("homepage_assets").select("*").eq("section_id", id).order("slot").order("sort_order"),
      supabase.from("categories").select("id, name, slug, sort_order").order("sort_order"),
      supabase.from("subcategories").select("id, category_id, name, slug, kind, sort_order").order("sort_order"),
      supabase.from("pages").select("slug, title"),
      supabase.from("products").select("slug, name, is_active").order("name"),
      supabase.from("site_settings").select("key, value"),
    ]);
  if (!section) notFound();
  const spec = SECTION_SPECS[section.type];

  // Group assets into slots: image A (with text) + optional image B.
  const bySlot = new Map<number, typeof assets>();
  for (const a of assets ?? []) bySlot.set(a.slot, [...(bySlot.get(a.slot) ?? []), a]);
  const count = slotCount(spec, bySlot.size);
  const slots: EditorSlot[] = Array.from({ length: count }, (_, i) => {
    const rows = (bySlot.get(i) ?? []).sort((a, b) => a.sort_order - b.sort_order);
    const a = rows[0];
    return {
      images: spec.images.map((_, j) => ({ url: rows[j]?.image_url ?? null, alt: rows[j]?.image_alt ?? "" })),
      fields: {
        heading: a?.heading ?? "",
        subheading: a?.subheading ?? "",
        button_label: a?.button_label ?? "",
        link_url: a?.link_url ?? "",
        badge_text: a?.badge_text ?? "",
      },
    };
  });

  // Suggestions for link fields: collections and content pages.
  const links = [
    ...(cats ?? []).flatMap((c) => [
      { value: `/collections/${c.slug}`, label: c.name },
      ...(subs ?? [])
        .filter((s) => s.category_id === c.id && s.kind !== "view_all")
        .map((s) => ({ value: subcategoryHref(c.slug, s), label: `${c.name} › ${s.name}` })),
    ]),
    ...(pages ?? []).flatMap((p) => (PAGE_PATHS[p.slug] ? [{ value: PAGE_PATHS[p.slug], label: p.title }] : [])),
  ];

  const settingValues = Object.fromEntries(
    (spec.settings ?? []).map((f) => {
      const v = settings?.find((s) => s.key === f.key)?.value;
      return [f.key, typeof v === "number" || typeof v === "string" ? v : ""];
    }),
  );

  return (
    <SectionEditor
      id={section.id}
      type={section.type}
      initialConfig={section.config && typeof section.config === "object" && !Array.isArray(section.config) ? (section.config as Record<string, unknown>) : {}}
      initialSlots={slots}
      initialSettings={settingValues}
      links={links}
      products={(products ?? []).map((p) => ({ slug: p.slug, name: p.name, active: p.is_active }))}
    />
  );
}
