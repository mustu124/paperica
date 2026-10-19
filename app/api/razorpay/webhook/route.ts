import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { markOrderFailed, markOrderPaid } from "@/lib/checkout/orders";
import { rupeesToPaise } from "@/lib/format";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

type PaymentEntity = { id: string; order_id: string | null; amount: number; status: string };
type RazorpayEvent = {
  event: string;
  payload: {
    payment?: { entity: PaymentEntity };
    order?: { entity: { id: string; amount_paid: number; status: string } };
  };
};

/**
 * Razorpay webhook (Dashboard → Webhooks → https://<site>/api/razorpay/webhook).
 * Handles payment.captured, order.paid and payment.failed idempotently: every event id is
 * recorded once in razorpay_events. Reconciles orders whose buyer closed the tab before the
 * browser could call /api/checkout/verify ("payment deducted but order not confirmed").
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!signature || !verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: RazorpayEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const eventId = request.headers.get("x-razorpay-event-id") || createHash("sha256").update(raw).digest("hex");

  // Idempotency: a duplicate delivery hits the unique constraint and is acknowledged.
  const { error: logError } = await supabase.from("razorpay_events").insert({ event_id: eventId, payload: event });
  if (logError) {
    if (logError.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
    console.error("[webhook] could not record event:", logError.message);
    return NextResponse.json({ error: "temporary failure" }, { status: 500 });
  }

  try {
    await handleEvent(event);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(`[webhook] ${event.event} failed:`, (e as Error).message);
    // Forget the event so Razorpay's automatic retry gets processed.
    await supabase.from("razorpay_events").delete().eq("event_id", eventId);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}

async function handleEvent(event: RazorpayEvent) {
  const payment = event.payload.payment?.entity;
  const razorpayOrderId = event.payload.order?.entity.id ?? payment?.order_id;
  if (!razorpayOrderId) return; // not tied to one of our orders

  const { data: order, error } = await createAdminClient()
    .from("orders")
    .select("id, order_number, total_inr, payment_status")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) {
    console.warn(`[webhook] no order for Razorpay order ${razorpayOrderId}`);
    return;
  }

  switch (event.event) {
    case "payment.captured":
    case "order.paid": {
      const paidPaise = event.event === "order.paid" ? event.payload.order?.entity.amount_paid : payment?.amount;
      const expected = rupeesToPaise(order.total_inr);
      if (paidPaise !== expected) {
        // Don't auto-confirm a mismatched amount; leave it for the admin to review.
        console.error(`[webhook] amount mismatch on ${order.order_number}: paid ${paidPaise}, expected ${expected}`);
        return;
      }
      const changed = await markOrderPaid(order.id, payment?.id ?? null);
      if (changed) console.info(`[webhook] ${order.order_number} confirmed via ${event.event}`);
      return;
    }
    case "payment.failed":
      await markOrderFailed(order.id);
      return;
    default:
      return;
  }
}
