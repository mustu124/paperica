import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { orderSearchFilter, parseOrderFilters } from "@/lib/admin/orders";

const csvCell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  // Neutralise spreadsheet formulas in customer-entered text.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV export of orders, honouring the same filters as the Orders page. */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return new Response("Not authorised", { status: 401 });

  const f = parseOrderFilters(Object.fromEntries(request.nextUrl.searchParams));
  let query = admin.supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (f.payment !== "all") query = query.eq("payment_status", f.payment);
  if (f.dispatch) query = query.eq("dispatch_status", f.dispatch);
  const search = orderSearchFilter(f.q);
  if (search) query = query.or(search);
  const { data, error } = await query;
  if (error) return new Response(`Export failed: ${error.message}`, { status: 500 });

  const ids = (data ?? []).map((o) => o.id);
  const items: { order_id: string; product_name: string; variant_label: string | null; qty: number }[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data: chunk } = await admin.supabase
      .from("order_items")
      .select("order_id, product_name, variant_label, qty")
      .in("order_id", ids.slice(i, i + 200));
    items.push(...(chunk ?? []));
  }

  const header = [
    "Order number", "Date", "Customer", "Email", "Phone", "Address line 1", "Address line 2", "City", "State", "PIN code",
    "Items", "Subtotal", "Shipping", "Total", "Payment status", "Dispatch status", "Courier", "Tracking", "Razorpay payment id", "Note",
  ];
  const rows = (data ?? []).map((o) => {
    const lines = items
      .filter((i) => i.order_id === o.id)
      .map((i) => `${i.qty} x ${i.product_name}${i.variant_label ? ` (${i.variant_label})` : ""}`)
      .join("; ");
    return [
      o.order_number, o.created_at, o.customer_name, o.customer_email, o.customer_phone, o.shipping_address_line1,
      o.shipping_address_line2, o.city, o.state, o.pincode, lines, o.subtotal_inr, o.shipping_inr, o.total_inr,
      o.payment_status, o.dispatch_status, o.courier_name, o.tracking_details, o.razorpay_payment_id, o.notes,
    ].map(csvCell).join(",");
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + [header.join(","), ...rows].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="paperica-orders-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
