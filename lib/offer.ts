// Free gift offer (Site Settings → Free gift offer): which products it's shown on.
// The offer itself is applied at checkout (lib/checkout/pricing.ts).
import { settingBool, settingNumber, settingString, type SiteSettings } from "./settings";

export type GiftOffer = { text: string; minQty: number; giftSlug: string };

export function giftOffer(settings: SiteSettings): GiftOffer | null {
  const giftSlug = settingString(settings, "gift_offer_product_slug").trim();
  if (!settingBool(settings, "gift_offer_enabled") || !giftSlug) return null;
  return {
    text: settingString(settings, "gift_offer_text").trim(),
    minQty: Math.max(1, Math.floor(settingNumber(settings, "gift_offer_min_qty") ?? 2)),
    giftSlug,
  };
}

/** Products that count towards the offer: marked New, sold online, and not the free item itself. */
export function countsTowardsOffer(offer: GiftOffer | null, p: { isNew: boolean; mode: string; slug: string }) {
  return Boolean(offer && p.isNew && p.mode === "buy" && p.slug !== offer.giftSlug);
}
