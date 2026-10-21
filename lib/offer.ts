// Free-gift offers (Admin → Offers): "buy N from <scope>, get <product> free".
// Stored as one site setting ("offers", a JSON list). Applied at checkout (lib/checkout/pricing.ts);
// shown on the products that count towards an offer (cards, product page, cart).
import { z } from "zod";
import { settingBool, settingNumber, settingString, type SiteSettings } from "./settings";

// Shared with the browser (admin form): skip zod's `new Function` probe, which the CSP reports.
z.config({ jitless: true });

/** Which products count towards an offer. */
export type OfferScope =
  | { kind: "new" } // products marked New
  | { kind: "category"; id: string } // anything in a menu head (e.g. GIFTS)
  | { kind: "subcategory"; id: string }; // anything in one section (e.g. Journals)

const scope = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("new") }),
  z.object({ kind: z.literal("category"), id: z.uuid() }),
  z.object({ kind: z.literal("subcategory"), id: z.uuid() }),
]);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();

export const offerSchema = z.object({
  id: z.string().min(1).max(64),
  enabled: z.boolean(),
  scope,
  min_qty: z.number().int().min(1).max(20),
  /** The free product (by id; the slug is kept for display and older data). */
  gift_product_id: z.uuid().nullable(),
  gift_slug: z.string().max(200),
  /** Wording shown to customers, e.g. "Buy any 2 from the New Collection, get Snap-in Separators free". */
  text: z.string().trim().max(200),
  starts_on: day,
  ends_on: day,
});
export type Offer = z.infer<typeof offerSchema>;
export const offersSchema = z.array(offerSchema).max(20);

/** All offers. Falls back to the older single-offer settings (gift_offer_*) if "offers" isn't set. */
export function getOffers(settings: SiteSettings): Offer[] {
  const raw = settings.offers;
  if (raw !== undefined && raw !== null) {
    const parsed = offersSchema.safeParse(raw);
    return parsed.success ? parsed.data : [];
  }
  const giftSlug = settingString(settings, "gift_offer_product_slug").trim();
  if (!giftSlug) return [];
  return [
    {
      id: "legacy",
      enabled: settingBool(settings, "gift_offer_enabled"),
      scope: { kind: "new" },
      min_qty: Math.max(1, Math.floor(settingNumber(settings, "gift_offer_min_qty") ?? 2)),
      gift_product_id: null,
      gift_slug: giftSlug,
      text: settingString(settings, "gift_offer_text").trim(),
      starts_on: null,
      ends_on: null,
    },
  ];
}

/** Today in India, as YYYY-MM-DD (offer dates are whole days). */
export function todayInIndia(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}

/** Offers that are switched on and within their dates on `today` (YYYY-MM-DD, India). */
export function activeOffers(settings: SiteSettings, today: string): Offer[] {
  return getOffers(settings).filter(
    (o) => o.enabled && (!o.starts_on || o.starts_on <= today) && (!o.ends_on || o.ends_on >= today),
  );
}

/** What we know about a product to decide whether it counts towards an offer. */
export type OfferProduct = {
  id: string;
  slug: string;
  mode: string;
  isNew: boolean;
  subcategoryIds: string[];
  categoryIds: string[];
};

/** Sold online, not the free item itself, and inside the offer's scope. */
export function countsTowards(offer: Offer, p: OfferProduct) {
  if (p.mode !== "buy") return false;
  if (p.id === offer.gift_product_id || p.slug === offer.gift_slug) return false;
  switch (offer.scope.kind) {
    case "new":
      return p.isNew;
    case "category":
      return p.categoryIds.includes(offer.scope.id);
    case "subcategory":
      return p.subcategoryIds.includes(offer.scope.id);
  }
}

/** Short tag for product cards, e.g. "Buy 2 · Free gift". */
export const offerTag = (offer: Offer) => `Buy ${offer.min_qty} · Free gift`;
