import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { HomepageSectionType, Json, Tables } from "@/types/db";
import { TAGS } from "./tags";

export type HomepageSection = {
  id: string;
  type: HomepageSectionType;
  config: Record<string, Json | undefined>;
  assets: Tables<"homepage_assets">[];
};

/** Active homepage sections (optionally of one type) with their assets, in order. */
export async function getHomepageSections(type?: HomepageSectionType): Promise<HomepageSection[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.homepage);

  const supabase = createPublicClient();
  let query = supabase
    .from("homepage_sections")
    .select("id, type, sort_order, config")
    .eq("is_active", true)
    .order("sort_order");
  if (type) query = query.eq("type", type);

  const { data: sections, error } = await query;
  if (error) {
    console.error("[homepage] failed to load sections:", error.message);
    return [];
  }
  if (sections.length === 0) return [];

  const { data: assets, error: assetError } = await supabase
    .from("homepage_assets")
    .select("*")
    .in(
      "section_id",
      sections.map((s) => s.id),
    )
    .order("slot")
    .order("sort_order");
  if (assetError) console.error("[homepage] failed to load assets:", assetError.message);

  return sections.map((s) => ({
    id: s.id,
    type: s.type,
    config:
      s.config && typeof s.config === "object" && !Array.isArray(s.config)
        ? (s.config as Record<string, Json | undefined>)
        : {},
    assets: (assets ?? []).filter((a) => a.section_id === s.id),
  }));
}
