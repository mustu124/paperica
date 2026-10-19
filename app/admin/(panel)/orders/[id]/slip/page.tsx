import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { formatDate } from "@/lib/format";
import { formatWhatsAppDisplay } from "@/lib/whatsapp";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Packing slip" };

type Props = { params: Promise<{ id: string }> };

export default function SlipPage({ params }: Props) {
  return (
    <Suspense>
      <Slip params={params} />
    </Suspense>
  );
}

/** Print-friendly packing slip (no prices): ship-to address and items to pack. */
async function Slip({ params }: Props) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return null;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const [{ data: order }, { data: items }, { data: settings }] = await Promise.all([
    admin.supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    admin.supabase.from("order_items").select("*").eq("order_id", id),
    admin.supabase.from("site_settings").select("key, value").in("key", ["brand_name", "contact_email", "whatsapp_number"]),
  ]);
  if (!order) notFound();
  const s = (k: string) => {
    const v = settings?.find((x) => x.key === k)?.value;
    return typeof v === "string" ? v : "";
  };

  return (
    <div className="mx-auto max-w-2xl bg-white p-8 text-ink print:p-0">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <header className="mb-8 flex items-start justify-between border-b-2 border-ink pb-4">
        <div>
          <p className="font-display text-3xl text-chilli">{s("brand_name")}</p>
          <p className="text-xs text-ink-muted">
            {[s("contact_email"), s("whatsapp_number") && formatWhatsAppDisplay(s("whatsapp_number"))].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-ink-muted">Packing slip</p>
          <p className="text-xl font-semibold">{order.order_number}</p>
          <p className="text-sm">{formatDate(order.created_at)}</p>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-muted">Ship to</h2>
        <address className="text-lg not-italic leading-relaxed">
          {order.customer_name}
          <br />
          {order.shipping_address_line1}
          {order.shipping_address_line2 && (
            <>
              <br />
              {order.shipping_address_line2}
            </>
          )}
          <br />
          {order.city}, {order.state} — {order.pincode}
          <br />
          Phone: +91 {order.customer_phone}
        </address>
      </section>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-ink">
            <th className="py-2 font-semibold">Item</th>
            <th className="w-20 py-2 text-right font-semibold">Qty</th>
            <th className="w-16 py-2 text-center font-semibold">✓</th>
          </tr>
        </thead>
        <tbody>
          {(items ?? []).map((it) => (
            <tr key={it.id} className="border-b border-taupe">
              <td className="py-3">
                {it.product_name}
                {it.variant_label && <span className="block text-sm text-ink-muted">{it.variant_label}</span>}
              </td>
              <td className="py-3 text-right text-lg font-semibold">{it.qty}</td>
              <td className="py-3 text-center">
                <span className="inline-block size-5 border border-ink" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {order.notes && (
        <section className="mt-8 border border-taupe p-4">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-ink-muted">Customer note</h2>
          <p className="whitespace-pre-line">{order.notes}</p>
        </section>
      )}
    </div>
  );
}
