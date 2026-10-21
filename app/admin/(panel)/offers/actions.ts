"use server";

import { friendlyError, NOT_AUTHORISED, requireAdmin, type ActionResult } from "@/lib/admin/auth";
import { offersSchema, type Offer } from "@/lib/offer";
import { refreshTags } from "@/lib/revalidate";

/** Saves the whole list of offers (site setting "offers"). */
export async function saveOffers(input: Offer[]): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const parsed = offersSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the offers: every offer needs what to buy, how many and a free product." };
  for (const o of parsed.data) {
    if (!o.gift_product_id) return { ok: false, error: "Choose the free product for every offer." };
    if (o.starts_on && o.ends_on && o.starts_on > o.ends_on) return { ok: false, error: "An offer ends before it starts. Check the dates." };
  }
  const { error } = await admin.supabase.from("site_settings").upsert({ key: "offers", value: parsed.data });
  if (error) return { ok: false, error: friendlyError(error) };
  refreshTags("settings", "products");
  return { ok: true };
}
