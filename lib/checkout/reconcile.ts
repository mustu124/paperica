import "server-only";
import { rupeesToPaise } from "@/lib/format";
import { getRazorpay } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { markOrderPaid } from "./orders";

type PendingOrder = { id: string; razorpay_order_id: string | null; total_inr: number | string; payment_status: string };

/**
 * Asks Razorpay whether a pending order was paid (a captured payment for the full amount) and,
 * if so, marks it paid. The safety net for payments the browser couldn't confirm (e.g. after
 * paying in a UPI app) when the webhook is missing or misconfigured. Never throws.
 */
export async function reconcileOrder(order: PendingOrder): Promise<"paid" | "unpaid" | "error"> {
  if (order.payment_status === "paid") return "paid";
  if (!order.razorpay_order_id || order.payment_status === "refunded") return "unpaid";
  try {
    const { items } = await getRazorpay().orders.fetchPayments(order.razorpay_order_id);
    const expected = rupeesToPaise(order.total_inr);
    const payment = items.find((p) => p.status === "captured" && Number(p.amount) === expected);
    if (!payment) return "unpaid";
    await markOrderPaid(order.id, payment.id);
    console.info(`[reconcile] ${order.razorpay_order_id} confirmed paid from Razorpay (${payment.id})`);
    return "paid";
  } catch (e) {
    const err = e as { error?: { description?: string }; message?: string };
    console.error(`[reconcile] ${order.razorpay_order_id}:`, err.error?.description ?? err.message);
    return "error";
  }
}

/** Reconciles recent pending orders (admin Orders list): newest first, at most `limit`. */
export async function reconcileRecentPending(days = 7, limit = 10) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data } = await createAdminClient()
    .from("orders")
    .select("id, razorpay_order_id, total_inr, payment_status")
    .in("payment_status", ["pending", "failed"])
    .not("razorpay_order_id", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);
  const results = await Promise.all((data ?? []).map(reconcileOrder));
  return results.filter((r) => r === "paid").length;
}
