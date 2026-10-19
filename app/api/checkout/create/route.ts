import { NextResponse, type NextRequest } from "next/server";
import { priceItems } from "@/lib/checkout/pricing";
import { createOrderSchema } from "@/lib/checkout/schema";
import { rupeesToPaise } from "@/lib/format";
import { getRazorpay } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Creates a pending order from a re-priced cart and a matching Razorpay order.
 * Prices, stock, availability and shipping all come from the database.
 */
export async function POST(request: NextRequest) {
  if (!(await rateLimit(request, "checkout", 10, 600))) {
    return json({ error: "Too many checkout attempts. Please wait a few minutes and try again." }, 429);
  }

  const parsed = createOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Please check your details and try again.", fields: parsed.error.flatten().fieldErrors }, 400);
  }
  const { items, customer, website, expectedTotal } = parsed.data;
  // Honeypot: real customers never see or fill this field.
  if (website) return json({ error: "Please check your details and try again." }, 400);

  let quote;
  try {
    quote = await priceItems(items);
  } catch (e) {
    console.error("[checkout/create] pricing failed:", (e as Error).message);
    return json({ error: "We couldn't confirm your cart. Please try again." }, 500);
  }

  if (quote.issues.length > 0 || quote.lines.length === 0) {
    return json({ error: "Some items in your cart need attention.", quote }, 409);
  }
  if (expectedTotal != null && Math.abs(expectedTotal - quote.total) > 0.009) {
    return json({ error: "Prices have been updated. Please review your order before paying.", quote }, 409);
  }

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      shipping_address_line1: customer.line1,
      shipping_address_line2: customer.line2 || null,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      notes: customer.note || null,
      subtotal_inr: quote.subtotal,
      shipping_inr: quote.shipping,
      total_inr: quote.total,
    })
    .select("id, order_number")
    .single();
  if (orderError || !order) {
    console.error("[checkout/create] order insert failed:", orderError?.message);
    return json({ error: "We couldn't place your order. Please try again." }, 500);
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    quote.lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      variant_id: l.variantId,
      product_name: l.name,
      variant_label: l.variantLabel,
      unit_price_inr: l.unitPrice,
      qty: l.qty,
      image_url: l.image,
    })),
  );
  if (itemsError) {
    console.error("[checkout/create] items insert failed:", itemsError.message);
    await supabase.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
    return json({ error: "We couldn't place your order. Please try again." }, 500);
  }

  let razorpayOrderId: string;
  try {
    const rzpOrder = await getRazorpay().orders.create({
      amount: rupeesToPaise(quote.total),
      currency: "INR",
      receipt: order.order_number,
      notes: { order_number: order.order_number, order_id: order.id },
    });
    razorpayOrderId = rzpOrder.id;
  } catch (e) {
    console.error("[checkout/create] Razorpay order failed:", (e as { error?: { description?: string } }).error?.description ?? (e as Error).message);
    await supabase.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
    return json({ error: "The payment gateway is unavailable right now. Please try again shortly." }, 502);
  }

  const { error: linkError } = await supabase
    .from("orders")
    .update({ razorpay_order_id: razorpayOrderId })
    .eq("id", order.id);
  if (linkError) {
    console.error("[checkout/create] saving razorpay_order_id failed:", linkError.message);
    return json({ error: "We couldn't place your order. Please try again." }, 500);
  }

  return json({
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    razorpayOrderId,
    amount: rupeesToPaise(quote.total),
    currency: "INR",
    orderNumber: order.order_number,
    prefill: { name: customer.name, email: customer.email, contact: `+91${customer.phone}` },
  });
}
