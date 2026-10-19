import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { SiteSettings } from "@/lib/settings";
import { TAGS } from "./tags";

/** All site_settings rows as a key → value map. Cached; tagged "settings". */
export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.settings);

  const { data, error } = await createPublicClient()
    .from("site_settings")
    .select("key, value");

  if (error) {
    console.error("[settings] failed to load site_settings:", error.message);
    return {};
  }
  return Object.fromEntries(data.map((row) => [row.key, row.value]));
}
