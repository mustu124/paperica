import type { Tables } from "@/types/db";

export type Asset = Tables<"homepage_assets">;

/** A panel/tile: image A (sort_order 0, carries the text) and an optional image B. */
export type Slot = {
  slot: number;
  primary: Asset;
  images: { url: string; alt: string; mobileUrl: string | null }[]; // [A] or [A, B]; mobileUrl = phone version
};

/** Groups a section's assets by slot, ordered by slot then sort_order. */
export function groupSlots(assets: Asset[]): Slot[] {
  const bySlot = new Map<number, Asset[]>();
  for (const a of assets) bySlot.set(a.slot, [...(bySlot.get(a.slot) ?? []), a]);

  return [...bySlot.entries()]
    .sort(([a], [b]) => a - b)
    .map(([slot, list]) => {
      const sorted = [...list].sort((a, b) => a.sort_order - b.sort_order);
      return {
        slot,
        primary: sorted[0],
        images: sorted
          .filter((a) => a.image_url)
          .slice(0, 2)
          .map((a) => ({ url: a.image_url as string, alt: a.image_alt, mobileUrl: a.mobile_image_url ?? null })),
      };
    });
}

export function configString(config: Record<string, unknown>, key: string) {
  const v = config[key];
  return typeof v === "string" ? v : "";
}
