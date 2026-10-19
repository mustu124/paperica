import { NextResponse, type NextRequest } from "next/server";
import { trackOrderSchema } from "@/lib/checkout/schema";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const NOT_FOUND = "We couldn't find an order with those details. Please check the order number and the mobile number or email used at checkout.";

const digits = (s: string) => s.replace(/\D/g, "").slice(-10);

/** Guest order lookup: order number + the mobile number or email used at checkout. */
export async function POST(request: NextRequest) {
  if (!(await rateLimit(request, "track", 10, 900))) {
    return NextResponse.json({ error: "Too many lookups. Please try again in 15 minutes." }, { status: 429 });
  }
  const parsed = trackOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
  }
  const { orderNumber, contact, website } = parsed.data;
  if (website) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, customer_email, customer_phone, payment_status, dispatch_status, courier_name, tracking_details, total_inr, created_at")
    .eq("order_number", orderNumber)
    .maybeSingle();

  const matches =
    order &&
    (contact.includes("@")
      ? order.customer_email.toLowerCase() === contact.toLowerCase()
      : digits(contact).length === 10 && digits(order.customer_phone) === digits(contact));
  if (!order || !matches) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, variant_label, qty")
    .eq("order_id", order.id);

  // Deliberately no address or full contact details in the response.
  return NextResponse.json(
    {
      orderNumber: order.order_number,
      placedAt: order.created_at,
      paymentStatus: order.payment_status,
      dispatchStatus: order.dispatch_status,
      courierName: order.courier_name,
      trackingDetails: order.tracking_details,
      total: Number(order.total_inr),
      items: items ?? [],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
