"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Card, Field, inputCls, Toggle } from "@/components/admin/ui";
import { useSave } from "@/components/admin/use-save";
import { Button } from "@/components/ui/button";
import { DISPATCH_OPTIONS } from "@/lib/admin/orders";
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

/** Dispatch status, the receipt ID the customer sees on Track Your Order, and the refunded flag. */
export function OrderManager({
  order,
}: {
  order: {
    id: string;
    payment_status: PaymentStatus;
    dispatch_status: DispatchStatus;
    /** Receipt ID (stored in orders.tracking_details). */
    tracking_details: string | null;
  };
}) {
  const [dispatch, setDispatch] = useState<DispatchStatus>(order.dispatch_status);
  const [receipt, setReceipt] = useState(order.tracking_details ?? "");
  const [refunded, setRefunded] = useState(order.payment_status === "refunded");
  const { run, pending } = useSave();

  return (
    <Card title="Dispatch" className="print:hidden">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void run(
            () =>
              updateOrder(order.id, {
                dispatch_status: dispatch,
                receipt_id: receipt,
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
        <Field label="Receipt ID" hint="The customer sees this on Track Your Order.">
          <input value={receipt} onChange={(e) => setReceipt(e.target.value)} className={inputCls} />
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
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </Card>
  );
}
