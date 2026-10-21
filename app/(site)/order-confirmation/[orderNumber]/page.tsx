import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2, Clock } from "lucide-react";
import { Suspense } from "react";
import { z } from "zod";
import { PendingRefresher } from "@/components/site/checkout/pending-refresher";
import { buttonClasses, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { renderTokensText } from "@/lib/content";
import { getSiteSettings } from "@/lib/data/settings";
import { formatDate, formatINR } from "@/lib/format";
import { settingString } from "@/lib/settings";
import { reconcileOrder } from "@/lib/checkout/reconcile";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatWhatsAppDisplay, whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

type Props = PageProps<"/order-confirmation/[orderNumber]">;

export default function OrderConfirmationPage(props: Props) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 md:px-6">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Confirmation {...props} />
      </Suspense>
    </div>
  );
}

async function Confirmation({ params, searchParams }: Props) {
  const [{ orderNumber }, sp, settings] = await Promise.all([params, searchParams, getSiteSettings()]);
  const token = z.uuid().safeParse(Array.isArray(sp.t) ? sp.t[0] : sp.t);
  const s = (k: string) => renderTokensText(settingString(settings, k), settings);
  const email = settingString(settings, "contact_email");
  const wa = settingString(settings, "whatsapp_number");

  const contact = (
    <div className="flex flex-wrap gap-3">
      {email && (
        <a href={`mailto:${email}?subject=${encodeURIComponent(`Order ${orderNumber}`)}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
          Email us
        </a>
      )}
      {wa && (
        <a
          href={whatsappUrl(wa, `Hi! I have a question about my order ${orderNumber}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          WhatsApp {formatWhatsAppDisplay(wa)}
        </a>
      )}
    </div>
  );

  const supabase = createAdminClient();
  const { data: order } = token.success
    ? await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber)
        .eq("access_token", token.data)
        .maybeSingle()
    : { data: null };

  // Without the private token we don't show personal details (order numbers are sequential).
  if (!order) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="font-serif text-3xl font-semibold">Thank you</h1>
        <p className="text-ink-muted">
          For any question about order <strong className="text-ink">{orderNumber}</strong>, get in touch with us.
        </p>
        <ButtonLink href="/contact">Contact us</ButtonLink>
      </div>
    );
  }

  // Paid in a UPI app but the browser never confirmed it? Ask Razorpay.
  if (order.payment_status === "pending" && (await reconcileOrder(order)) === "paid") order.payment_status = "paid";

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id);
  const paid = order.payment_status === "paid";

  return (
    <article className="space-y-10">
      <header className="space-y-3 text-center">
        {paid ? (
          <CheckCircle2 className="mx-auto size-12 text-stem-deep" strokeWidth={1.5} aria-hidden />
        ) : (
          <Clock className="mx-auto size-12 text-chilli" strokeWidth={1.5} aria-hidden />
        )}
        <h1 className="font-serif text-3xl font-semibold md:text-4xl">
          {paid ? "Thank you for your order" : "We're confirming your payment"}
        </h1>
        <p className="text-sm text-ink-muted">
          Order <strong className="text-ink">{order.order_number}</strong> · {formatDate(order.created_at)}
        </p>
        {paid ? (
          s("order_thank_you_text") && <p className="mx-auto max-w-xl">{s("order_thank_you_text")}</p>
        ) : (
          <>
            <p className="mx-auto max-w-xl">
              {order.payment_status === "failed"
                ? "This payment didn't go through, so no money was taken. You can place the order again from your cart."
                : "This usually takes a few seconds. If money has been deducted, your order will be confirmed automatically. Please don't pay again."}
            </p>
            {order.payment_status === "pending" && <PendingRefresher />}
          </>
        )}
      </header>

      {paid && s("ready_stock_dispatch_text") && (
        <section className="border-l-2 border-stem-deep bg-paper/60 px-5 py-4 text-sm leading-relaxed">
          <h2 className="mb-1 font-medium">What happens next</h2>
          <p>{s("ready_stock_dispatch_text")}</p>
          {s("ready_stock_delivery_text") && <p>{s("ready_stock_delivery_text")}</p>}
        </section>
      )}

      <section>
        <h2 className="mb-4 font-serif text-xl font-semibold">Order summary</h2>
        <ul className="divide-y divide-taupe border-y border-taupe">
          {(items ?? []).map((it) => (
            <li key={it.id} className="flex items-center gap-4 py-3">
              <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden bg-blush">
                {it.image_url && <Image src={it.image_url} alt="" fill sizes="56px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p>{it.product_name}</p>
                {it.variant_label && <p className="text-xs text-ink-muted">{it.variant_label}</p>}
                <p className="text-xs text-ink-muted">
                  {it.qty} × {formatINR(it.unit_price_inr)}
                </p>
              </div>
              <p className="text-sm">{formatINR(Number(it.unit_price_inr) * it.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="ml-auto mt-4 max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatINR(order.subtotal_inr)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{Number(order.shipping_inr) === 0 ? "Free" : formatINR(order.shipping_inr)}</dd>
          </div>
          <div className="flex justify-between border-t border-taupe pt-2 font-medium">
            <dt>Total</dt>
            <dd>{formatINR(order.total_inr)}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 font-serif text-lg font-semibold">Delivery address</h2>
          <address className="text-sm not-italic leading-relaxed">
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
            {order.city}, {order.state} {order.pincode}
            <br />
            +91 {order.customer_phone}
          </address>
        </div>
        <div>
          <h2 className="mb-2 font-serif text-lg font-semibold">Questions?</h2>
          <p className="mb-3 text-sm">Please include your order number {order.order_number}.</p>
          {contact}
        </div>
      </section>
    </article>
  );
}
