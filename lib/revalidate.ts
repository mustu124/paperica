import "server-only";
import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "./data/tags";

type Tag = (typeof TAGS)[keyof typeof TAGS];

/**
 * On-demand cache refresh after admin saves.
 * In Server Actions use `refreshTags` (the next request waits for fresh data, so the admin
 * sees their change). In Route Handlers / webhooks use `refreshTagsInBackground`
 * (stale-while-revalidate).
 */
export function refreshTags(...tags: Tag[]) {
  for (const tag of tags) updateTag(tag);
}

export function refreshTagsInBackground(...tags: Tag[]) {
  for (const tag of tags) revalidateTag(tag, "max");
}
