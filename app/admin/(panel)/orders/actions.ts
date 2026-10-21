"use server";

import { z } from "zod";
import type { TablesUpdate } from "@/types/db";
import { friendlyError, NOT_AUTHORISED, requireAdmin, type ActionResult } from "@/lib/admin/auth";

const orderUpdate = z.object({
  dispatch_status: z.enum(["processing", "dispatched", "delivered", "cancelled"]),
  /** Shown to the customer on Track Your Order (stored in tracking_details). */
  receipt_id: z.string().trim().max(200),
  mark_refunded: z.boolean(),
});

/**
 * Saves dispatch status and the receipt ID. Payment status can only be moved to
 * "refunded" (refunds themselves are made in the Razorpay dashboard).
 */
export async function updateOrder(id: string, input: z.input<typeof orderUpdate>): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const parsed = orderUpdate.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the order fields." };
  const v = parsed.data;

  const patch: TablesUpdate<"orders"> = {
    dispatch_status: v.dispatch_status,
    tracking_details: v.receipt_id || null,
  };
  if (v.mark_refunded) patch.payment_status = "refunded";

  const { error } = await admin.supabase.from("orders").update(patch).eq("id", id);
  return error ? { ok: false, error: friendlyError(error) } : { ok: true };
}
