import Image from "next/image";
import { formatINR } from "@/lib/format";
import type { Quote } from "@/lib/checkout/pricing";

/** Line items + subtotal / shipping / total (server-priced). */
export function OrderSummary({ quote }: { quote: Quote }) {
  const toFree =
    quote.freeShippingThreshold != null && quote.shipping > 0
      ? quote.freeShippingThreshold - quote.subtotal
      : null;

  return (
    <div className="space-y-5">
      <ul className="space-y-4">
        {quote.lines.map((l) => (
          <li key={l.key} className="flex items-center gap-4">
            <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-blush">
              {l.image && <Image src={l.image} alt="" fill sizes="64px" className="object-cover" />}
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-ink text-[0.625rem] text-white">
                {l.qty}
              </span>
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="leading-snug">{l.name}</p>
              {l.variantLabel && <p className="text-xs text-ink-muted">{l.variantLabel}</p>}
              <p className="text-xs text-ink-muted">
                {l.qty} × {formatINR(l.unitPrice)}
              </p>
            </div>
            <p className="shrink-0 text-sm">{formatINR(l.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <dl className="space-y-2 border-t border-taupe pt-4 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatINR(quote.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd>{quote.shipping === 0 ? "Free" : formatINR(quote.shipping)}</dd>
        </div>
        {toFree != null && toFree > 0 && (
          <p className="text-xs text-stem-deep">Add {formatINR(toFree)} more for free shipping.</p>
        )}
        <div className="flex justify-between border-t border-taupe pt-3 text-base font-medium">
          <dt>Total</dt>
          <dd>
            <span className="mr-1 text-xs font-normal text-ink-muted">INR</span>
            {formatINR(quote.total)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
