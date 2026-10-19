"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDate, formatINR } from "@/lib/format";

type Result = {
  orderNumber: string;
  placedAt: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  dispatchStatus: "processing" | "dispatched" | "delivered" | "cancelled";
  courierName: string | null;
  trackingDetails: string | null;
  total: number;
  items: { product_name: string; variant_label: string | null; qty: number }[];
};

const PAYMENT: Record<Result["paymentStatus"], string> = {
  pending: "Awaiting payment confirmation",
  paid: "Paid",
  failed: "Payment not completed",
  refunded: "Refunded",
};
const DISPATCH: Record<Result["dispatchStatus"], string> = {
  processing: "Being prepared",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const STEPS: Result["dispatchStatus"][] = ["processing", "dispatched", "delivered"];

const inputCls =
  "h-11 w-full border border-ink/30 bg-white px-3 text-base focus:border-chilli focus:outline-none";

export function TrackOrderForm() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setResult(null);
        setError(body.error ?? "Something went wrong. Please try again.");
      } else {
        setResult(body);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const step = result ? STEPS.indexOf(result.dispatchStatus) : -1;

  return (
    <div className="space-y-10">
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="flex flex-col gap-1 text-sm">
          Order number
          <input name="orderNumber" required placeholder="PPR-000123" autoCapitalize="characters" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mobile number or email
          <input name="contact" required autoComplete="email" placeholder="Used at checkout" className={inputCls} />
        </label>
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <input name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <Button type="submit" size="md" disabled={busy}>
          {busy ? "Looking up…" : "Track"}
        </Button>
      </form>

      <div aria-live="polite">
        {error && <p className="border-l-2 border-chilli bg-blush/40 px-4 py-3 text-sm">{error}</p>}

        {result && (
          <article className="space-y-6 border border-taupe p-6">
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-2xl font-semibold">{result.orderNumber}</h2>
              <p className="text-sm text-ink-muted">Placed {formatDate(result.placedAt)}</p>
            </header>

            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">Payment</dt>
                <dd className="font-medium">{PAYMENT[result.paymentStatus]}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Order status</dt>
                <dd className="font-medium">{DISPATCH[result.dispatchStatus]}</dd>
              </div>
              {result.courierName && (
                <div>
                  <dt className="text-ink-muted">Courier</dt>
                  <dd>{result.courierName}</dd>
                </div>
              )}
              {result.trackingDetails && (
                <div className="sm:col-span-2">
                  <dt className="text-ink-muted">Tracking details</dt>
                  <dd className="whitespace-pre-line break-words">{result.trackingDetails}</dd>
                </div>
              )}
            </dl>

            {result.paymentStatus === "paid" && result.dispatchStatus !== "cancelled" && (
              <ol className="grid grid-cols-3 gap-2 text-center text-xs" aria-label="Progress">
                {STEPS.map((s, i) => (
                  <li key={s} className="space-y-2">
                    <div className={i <= step ? "h-1.5 bg-stem-deep" : "h-1.5 bg-taupe"} />
                    <span className={i <= step ? "font-medium" : "text-ink-muted"}>{DISPATCH[s]}</span>
                  </li>
                ))}
              </ol>
            )}

            <div>
              <h3 className="mb-2 text-sm font-medium">Items</h3>
              <ul className="space-y-1 text-sm">
                {result.items.map((it, i) => (
                  <li key={i}>
                    {it.qty} × {it.product_name}
                    {it.variant_label && <span className="text-ink-muted"> ({it.variant_label})</span>}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm">Total: {formatINR(result.total)}</p>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
