import { NextResponse, type NextRequest } from "next/server";
import { markOrderPaid } from "@/lib/checkout/orders";
import { reconcileOrder } from "@/lib/checkout/reconcile";
import { verifyPaymentSchema } from "@/lib/checkout/schema";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Called by the browser after Razorpay Checkout succeeds. Verifies the HMAC signature,
 * marks the order paid (stock decremented atomically) and returns where to go next.
 * The webhook does the same independently, so a closed tab still ends up confirmed.
 */
export async function POST(request: NextRequest) {
  if (!(await rateLimit(request, "verify", 30, 600))) {
    return json({ error: "Too many requests." }, 429);
  }
  const parsed = verifyPaymentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid payment response." }, 400);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const { data: order, error } = await createAdminClient()
    .from("orders")
    .select("id, order_number, access_token, payment_status, razorpay_order_id, total_inr")
    .eq("razorpay_order_id", razorpay_order_id)
    .maybeSingle();
  if (error || !order) {
    console.error("[checkout/verify] order not found for", razorpay_order_id, error?.message);
    return json({ error: "Order not found. If money was deducted, please contact us." }, 404);
  }

  const signed = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!signed) {
    // Don't trust the browser: ask Razorpay itself whether this order was paid.
    console.warn("[checkout/verify] signature mismatch for", razorpay_order_id, "- checking with Razorpay");
    if ((await reconcileOrder(order)) === "paid") return json({ orderNumber: order.order_number, token: order.access_token });
    return json({ error: "We couldn't verify this payment. If money was deducted, please contact us." }, 400);
  }

  try {
    await markOrderPaid(order.id, razorpay_payment_id);
  } catch (e) {
    console.error("[checkout/verify]", (e as Error).message);
    return json({ error: "Payment received but we couldn't update your order yet. Please contact us." }, 500);
  }

  return json({ orderNumber: order.order_number, token: order.access_token });
}
