import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { Suspense } from "react";
import { Card, StatusBadge } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";
import { formatINR } from "@/lib/format";
import { CopyButton, OrderManager } from "./order-manager";

export const metadata: Metadata = { title: "Order" };

type Props = { params: Promise<{ id: string }> };

export default function OrderPage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

async function OrderDetail({ params }: Props) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return null;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const [{ data: order }, { data: items }, { data: setting }] = await Promise.all([
    admin.supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    admin.supabase.from("order_items").select("*").eq("order_id", id),
    admin.supabase.from("site_settings").select("value").eq("key", "whatsapp_tracking_template").maybeSingle(),
  ]);
  if (!order) notFound();

  const address = [
    order.customer_name,
    order.shipping_address_line1,
    order.shipping_address_line2,
    `${order.city}, ${order.state} ${order.pincode}`,
    `Phone: +91 ${order.customer_phone}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="inline-flex min-h-11 items-center text-sm text-ink-muted hover:text-chilli lg:min-h-0">
            ← Orders
          </Link>
          <h1 className="mt-1 font-serif text-3xl font-semibold">{order.order_number}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            {dateTime.format(new Date(order.created_at))}
            <StatusBadge status={order.payment_status} />
            <StatusBadge status={order.dispatch_status} />
          </p>
        </div>
        <Link href={`/admin/orders/${order.id}/slip`} target="_blank" className={buttonClasses({ variant: "secondary" })}>
          <Printer className="size-4" aria-hidden />
          Packing slip
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-6">
          <Card title="Items">
            <ul className="divide-y divide-taupe/70">
              {(items ?? []).map((it) => (
                <li key={it.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                  <div className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded bg-blush">
                    {it.image_url && <Image src={it.image_url} alt="" fill sizes="48px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{it.product_name}</p>
                    {it.variant_label && <p className="text-sm text-ink-muted">{it.variant_label}</p>}
                  </div>
                  <p className="ml-16 whitespace-nowrap text-sm sm:ml-0">
                    {it.qty} × {formatINR(it.unit_price_inr)}
                  </p>
                  <p className="ml-auto w-20 text-right font-medium">{formatINR(Number(it.unit_price_inr) * it.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatINR(order.subtotal_inr)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{formatINR(order.shipping_inr)}</dd>
              </div>
              <div className="flex justify-between border-t border-taupe pt-1 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatINR(order.total_inr)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Payment">
            <dl className="grid gap-2 text-sm sm:grid-cols-[10rem_1fr]">
              <dt className="text-ink-muted">Status</dt>
              <dd>
                <StatusBadge status={order.payment_status} />
              </dd>
              <dt className="text-ink-muted">Razorpay payment id</dt>
              <dd className="break-all font-mono text-xs">{order.razorpay_payment_id ?? "—"}</dd>
              <dt className="text-ink-muted">Razorpay order id</dt>
              <dd className="break-all font-mono text-xs">{order.razorpay_order_id ?? "—"}</dd>
            </dl>
            <p className="mt-3 text-xs text-ink-muted">Refunds are made in the Razorpay dashboard; then mark the order as refunded here.</p>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Customer" actions={<CopyButton text={address} label="Copy address" />}>
            <address className="whitespace-pre-line text-sm not-italic leading-relaxed">{address}</address>
            <p className="mt-3 text-sm">
              <a href={`mailto:${order.customer_email}`} className="text-chilli underline-offset-4 hover:underline">
                {order.customer_email}
              </a>
            </p>
            {order.notes && (
              <div className="mt-4 rounded-md bg-paper/60 p-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Order note</p>
                <p className="whitespace-pre-line">{order.notes}</p>
              </div>
            )}
          </Card>
          <OrderManager
            order={order}
            trackingTemplate={typeof setting?.value === "string" ? setting.value : ""}
          />
        </div>
      </div>
    </div>
  );
}
