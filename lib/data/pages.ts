import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/types/db";
import { TAGS } from "./tags";

export type PageRow = Tables<"pages">;

/** A CMS page by slug (policies, about, contact, faq, corporate gifting, ...). Tagged "pages". */
export async function getPage(slug: string): Promise<PageRow | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 86400 });
  cacheTag(TAGS.pages);

  const { data, error } = await createPublicClient().from("pages").select("*").eq("slug", slug).maybeSingle();
  if (error) {
    console.error(`[pages] failed to load "${slug}":`, error.message);
    return null;
  }
  return data;
}

/** All pages (for titles in link lists and the sitemap). */
export async function getAllPages(): Promise<PageRow[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 86400 });
  cacheTag(TAGS.pages);

  const { data, error } = await createPublicClient().from("pages").select("*");
  if (error) {
    console.error("[pages] failed to load pages:", error.message);
    return [];
  }
  return data;
}

export type FaqGroup = { name: string; items: Tables<"faqs">[] };

/** Active FAQs grouped by group_name, groups in the order of their first question. */
export async function getFaqGroups(): Promise<FaqGroup[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 86400 });
  cacheTag(TAGS.faqs);

  const { data, error } = await createPublicClient().from("faqs").select("*").order("sort_order");
  if (error) {
    console.error("[faqs] failed to load:", error.message);
    return [];
  }
  const groups: FaqGroup[] = [];
  for (const faq of data) {
    const group = groups.find((g) => g.name === faq.group_name);
    if (group) group.items.push(faq);
    else groups.push({ name: faq.group_name, items: [faq] });
  }
  return groups;
}

/** Plain-text excerpt of HTML for meta descriptions. */
export function excerpt(html: string | null | undefined, max = 160) {
  const text = (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
