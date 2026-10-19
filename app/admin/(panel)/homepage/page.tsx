import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";
import { SECTION_SPECS } from "@/lib/admin/homepage-specs";
import { SectionList } from "./section-list";

export const metadata: Metadata = { title: "Homepage" };

export default function HomepageAdmin() {
  return (
    <>
      <PageHeader title="Homepage" description="Sections appear on the homepage in this order. Turn them on or off, move them, or edit their pictures and text." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Sections />
      </Suspense>
    </>
  );
}

async function Sections() {
  const admin = await requireAdmin();
  if (!admin) return null;
  const [{ data: sections }, { data: assets }] = await Promise.all([
    admin.supabase.from("homepage_sections").select("id, type, sort_order, is_active").order("sort_order"),
    admin.supabase.from("homepage_assets").select("section_id, image_url, slot, sort_order").order("slot").order("sort_order"),
  ]);
  return (
    <SectionList
      sections={(sections ?? []).map((s) => ({
        id: s.id,
        type: s.type,
        title: SECTION_SPECS[s.type].title,
        description: SECTION_SPECS[s.type].description,
        isActive: s.is_active,
        reorderable: SECTION_SPECS[s.type].reorderable,
        thumbs: (assets ?? []).filter((a) => a.section_id === s.id && a.image_url).slice(0, 4).map((a) => a.image_url as string),
      }))}
    />
  );
}
