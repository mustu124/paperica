import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { onOrderPaid } from "@/lib/notifications";
import { refreshTagsInBackground } from "@/lib/revalidate";

/**
 * Marks an order paid and decrements stock (atomically, in Postgres). Safe to call from
 * both the browser verify step and the webhook: only the first call transitions the order,
 * and only that call triggers the "order paid" notification hook and refreshes the cached
 * product pages (stock counts, "Sold out", "Selling fast").
 */
export async function markOrderPaid(orderId: string, paymentId: string | null) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("mark_order_paid", { p_order_id: orderId, p_payment_id: paymentId });
  if (error) throw new Error(`mark_order_paid failed: ${error.message}`);
  if (data === true) {
    try {
      refreshTagsInBackground("products");
    } catch {
      // Not allowed while a page renders (order page / admin reconciling with Razorpay):
      // stock counts then refresh within a minute on their own.
    }
    await onOrderPaid(orderId);
  }
  return data === true;
}

/** Marks a pending order as failed (never downgrades a paid order). */
export async function markOrderFailed(orderId: string) {
  const { error } = await createAdminClient()
    .from("orders")
    .update({ payment_status: "failed" })
    .eq("id", orderId)
    .eq("payment_status", "pending");
  if (error) throw new Error(`mark failed: ${error.message}`);
}
