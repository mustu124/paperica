"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Card, Field, inputCls, Toggle } from "@/components/admin/ui";
import { useSave } from "@/components/admin/use-save";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { DISPATCH_OPTIONS, trackingMessage } from "@/lib/admin/orders";
import { whatsappUrl } from "@/lib/whatsapp";
import type { DispatchStatus, PaymentStatus } from "@/types/db";
import { updateOrder } from "../actions";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-ink/25 bg-white px-3 text-xs font-medium hover:border-chilli hover:text-chilli lg:min-h-0 lg:py-1.5 print:hidden"
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? "Copied" : label}
    </button>
  );
}

/** Dispatch status, courier/tracking fields, refunded flag and the WhatsApp tracking message. */
export function OrderManager({
  order,
  trackingTemplate,
}: {
  order: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    payment_status: PaymentStatus;
    dispatch_status: DispatchStatus;
    courier_name: string | null;
    tracking_details: string | null;
  };
  trackingTemplate: string;
}) {
  const [dispatch, setDispatch] = useState<DispatchStatus>(order.dispatch_status);
  const [courier, setCourier] = useState(order.courier_name ?? "");
  const [tracking, setTracking] = useState(order.tracking_details ?? "");
  const [refunded, setRefunded] = useState(order.payment_status === "refunded");
  const { run, pending } = useSave();

  const message = trackingMessage(trackingTemplate, {
    customer_name: order.customer_name,
    order_number: order.order_number,
    dispatch_status: dispatch,
    courier_name: courier,
    tracking_details: tracking,
  });

  return (
    <Card title="Dispatch & tracking" className="print:hidden">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void run(
            () =>
              updateOrder(order.id, {
                dispatch_status: dispatch,
                courier_name: courier,
                tracking_details: tracking,
                mark_refunded: refunded && order.payment_status !== "refunded",
              }),
            "Order updated",
          );
        }}
      >
        <Field label="Dispatch status">
          <select value={dispatch} onChange={(e) => setDispatch(e.target.value as DispatchStatus)} className={inputCls}>
            {DISPATCH_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Courier name">
          <input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. Delhivery, DTDC, Borzo" className={inputCls} />
        </Field>
        <Field label="Tracking details" hint="Tracking number and/or link. The customer sees this on Track Your Order.">
          <textarea value={tracking} onChange={(e) => setTracking(e.target.value)} rows={3} className={inputCls} />
        </Field>
        {(order.payment_status === "paid" || order.payment_status === "refunded") && (
          <div className="rounded-md bg-paper/50 p-3">
            <Toggle
              checked={refunded}
              onChange={setRefunded}
              disabled={order.payment_status === "refunded"}
              label="Refunded (refund made in the Razorpay dashboard)"
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          <a
            href={whatsappUrl(`91${order.customer_phone}`, message)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-none border border-stem-deep px-6 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-stem-deep hover:bg-stem-deep hover:text-white"
          >
            <WhatsAppIcon />
            Open WhatsApp
          </a>
        </div>
        <p className="text-xs text-ink-muted">WhatsApp opens with: “{message.split("\n")[0]}…”. Save first if you changed the details.</p>
      </form>
    </Card>
  );
}
