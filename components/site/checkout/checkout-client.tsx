"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type FieldError } from "react-hook-form";
import type { z } from "zod";
import { Button, ButtonLink } from "@/components/ui/button";
import { ScribbleCircle } from "@/components/ui/scribble-circle";
import { Skeleton } from "@/components/ui/skeleton";
import { applyQuoteToCart, clearCart } from "@/lib/cart";
import type { Quote } from "@/lib/checkout/pricing";
import { checkoutFormSchema, type CartItemInput } from "@/lib/checkout/schema";
import { INDIAN_STATES } from "@/lib/checkout/states";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import { useCart } from "../cart-provider";
import { InlineLinks } from "../inline-links";
import { OrderSummary } from "./order-summary";
import { loadRazorpay, openRazorpay, type RazorpaySuccess } from "./razorpay";

type FormInput = z.input<typeof checkoutFormSchema>;
type FormOutput = z.output<typeof checkoutFormSchema>;

type Payment = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderNumber: string;
  prefill: { name: string; email: string; contact: string };
};

type Status =
  | { kind: "idle" }
  | { kind: "working"; message: string }
  | { kind: "error"; message: string }
  | { kind: "cancelled" }
  | { kind: "failed"; message: string };

export type CheckoutCopy = {
  brandName: string;
  serviceabilityNote: string;
  sameDayNote: string;
  contactEmail: string;
  whatsappUrl: string;
  emptyCta: { label: string; href: string } | null;
  /** Policy titles from the pages table, so the consent text always matches the page names. */
  policies: Record<"terms" | "shipping" | "cancellation" | "privacy", { href: string; title: string }>;
};

const BRAND_COLOUR = "#C00000"; // chilli

function PolicyLink({ href, title }: { href: string; title: string }) {
  return (
    <Link href={href} target="_blank" className="underline underline-offset-2 hover:text-chilli">
      {title}
    </Link>
  );
}

function Field({
  label,
  error,
  optional,
  children,
  className,
}: {
  label: string;
  error?: FieldError;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1 text-sm", className)}>
      <span>
        {label}
        {optional && <span className="text-ink-muted"> (optional)</span>}
      </span>
      {children}
      {error?.message && (
        <span role="alert" className="text-xs text-chilli">
          {error.message}
        </span>
      )}
    </label>
  );
}

const inputCls =
  "h-11 w-full border border-ink/30 bg-white px-3 text-base text-ink placeholder:text-ink-muted/70 focus:border-chilli focus:outline-none aria-[invalid=true]:border-chilli";

export function CheckoutClient({ copy }: { copy: CheckoutCopy }) {
  const router = useRouter();
  const search = useSearchParams();
  const { items: cartItems, ready } = useCart();

  // "Buy now" checks out a single item without touching the saved cart.
  const buyNow = useMemo<CartItemInput | null>(() => {
    const id = search.get("buy");
    if (!id) return null;
    const qty = Number.parseInt(search.get("qty") ?? "1", 10);
    return { productId: id, variantId: search.get("variant") || null, qty: Number.isFinite(qty) && qty > 0 ? Math.min(qty, 99) : 1 };
  }, [search]);

  const items = useMemo<CartItemInput[]>(
    () => (buyNow ? [buyNow] : cartItems.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty }))),
    [buyNow, cartItems],
  );
  const itemsKey = JSON.stringify(items);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [payment, setPayment] = useState<Payment | null>(null);

  const acceptQuote = (q: Quote) => {
    setQuote(q);
    // Keep the explanation visible after the cart is corrected and re-quoted cleanly.
    if (q.issues.length > 0) setNotices(q.issues.map((i) => i.message));
    if (!buyNow && q.issues.length + q.lines.length > 0) applyQuoteToCart(q);
  };

  // Price the cart on the server whenever its contents change.
  useEffect(() => {
    const parsed: CartItemInput[] = JSON.parse(itemsKey);
    if (parsed.length === 0) return;
    const controller = new AbortController();
    fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: parsed }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "We couldn't load your cart.");
        setQuoteError(null);
        acceptQuote(data);
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setQuoteError(e.message);
      });
    return () => controller.abort();
    // acceptQuote only depends on buyNow, which is part of itemsKey's source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { agree: false, website: "" },
    mode: "onTouched",
  });

  const busy = status.kind === "working";

  const pay = async (p: Payment) => {
    try {
      setStatus({ kind: "working", message: "Opening secure payment…" });
      await loadRazorpay();
      openRazorpay(
        {
          key: p.keyId,
          amount: p.amount,
          currency: p.currency,
          name: copy.brandName,
          description: `Order ${p.orderNumber}`,
          order_id: p.razorpayOrderId,
          prefill: p.prefill,
          notes: { order_number: p.orderNumber },
          theme: { color: BRAND_COLOUR },
          handler: (res) => void verify(res),
          modal: { ondismiss: () => setStatus((s) => (s.kind === "working" ? { kind: "cancelled" } : s)) },
        },
        (message) => setStatus({ kind: "failed", message }),
      );
    } catch (e) {
      setStatus({ kind: "error", message: (e as Error).message });
    }
  };

  const verify = async (res: RazorpaySuccess) => {
    setStatus({ kind: "working", message: "Confirming your payment…" });
    try {
      const r = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(res),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      if (!buyNow) clearCart();
      window.scrollTo({ top: 0 }); // land on the "Thank you" heading, not mid-page
      router.replace(`/order-confirmation/${data.orderNumber}?t=${data.token}`);
    } catch (e) {
      setStatus({
        kind: "error",
        message:
          (e as Error).message ||
          "We couldn't confirm your payment automatically. If money was deducted, your order will be confirmed shortly — please contact us with your order number.",
      });
    }
  };

  const onSubmit = async (values: FormOutput) => {
    if (!quote || busy) return;
    setStatus({ kind: "working", message: "Placing your order…" });
    try {
      const { agree, website, ...customer } = values;
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, customer, agree, website, expectedTotal: quote.total }),
      });
      const data = await res.json();
      if (res.status === 409 && data.quote) {
        acceptQuote(data.quote);
        setStatus({ kind: "error", message: data.error });
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "We couldn't place your order.");
      setPayment(data);
      await pay(data);
    } catch (e) {
      setStatus({ kind: "error", message: (e as Error).message });
    }
  };

  // ---- Empty / loading states ------------------------------------------------
  // Until the saved cart is read, show the form's shape (avoids an "empty cart" flash and layout shift).
  if (!buyNow && !ready) return <CheckoutSkeleton />;
  if (items.length === 0) {
    return (
      <div className="relative isolate mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
        <ScribbleCircle className="absolute left-1/2 top-1/2 -z-10 size-80 -translate-x-1/2 -translate-y-1/2" />
        <p className="font-serif text-3xl font-semibold">Your cart is empty</p>
        <p className="text-sm text-ink-muted">Add something you love, then come back to check out.</p>
        {copy.emptyCta && (
          <ButtonLink href={copy.emptyCta.href} variant="secondary" className="mt-3">
            {copy.emptyCta.label}
          </ButtonLink>
        )}
      </div>
    );
  }

  const summary = quote ? (
    <OrderSummary quote={quote} />
  ) : quoteError ? (
    <p className="text-sm text-chilli">{quoteError}</p>
  ) : (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
  const canPay = Boolean(quote && quote.lines.length > 0 && quote.issues.length === 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-14">
      {/* Mobile: collapsible summary at the top */}
      <details className="group border-y border-taupe bg-paper/50 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-1 py-4 text-sm [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 text-chilli">
            Show order summary
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
          </span>
          <span className="font-medium">{quote ? formatINR(quote.total) : "…"}</span>
        </summary>
        <div className="px-1 pb-5">{summary}</div>
      </details>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
        {notices.length > 0 && (
          <div role="alert" className="border-l-2 border-chilli bg-blush/40 px-4 py-3 text-sm">
            <p className="mb-1 font-medium">We&apos;ve updated your order:</p>
            <ul className="list-disc space-y-0.5 pl-5">
              {notices.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold">Contact</h2>
          <Field label="Full name" error={errors.name}>
            <input {...register("name")} autoComplete="name" aria-invalid={!!errors.name} className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" error={errors.email}>
              <input {...register("email")} type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} className={inputCls} />
            </Field>
            <Field label="Mobile number" error={errors.phone}>
              <div className="flex">
                <span className="flex h-11 items-center border border-r-0 border-ink/30 bg-paper px-3 text-sm text-ink-muted">+91</span>
                <input {...register("phone")} type="tel" autoComplete="tel-national" inputMode="numeric" placeholder="10-digit mobile" aria-invalid={!!errors.phone} className={inputCls} />
              </div>
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold">Delivery address</h2>
          {copy.serviceabilityNote && <p className="text-sm text-ink-muted">{copy.serviceabilityNote}</p>}
          <Field label="Address line 1" error={errors.line1}>
            <input {...register("line1")} autoComplete="address-line1" placeholder="House / flat no., building, street" aria-invalid={!!errors.line1} className={inputCls} />
          </Field>
          <Field label="Address line 2" optional error={errors.line2}>
            <input {...register("line2")} autoComplete="address-line2" placeholder="Area, landmark" className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" error={errors.city}>
              <input {...register("city")} autoComplete="address-level2" aria-invalid={!!errors.city} className={inputCls} />
            </Field>
            <Field label="State / UT" error={errors.state}>
              <select {...register("state")} autoComplete="address-level1" aria-invalid={!!errors.state} className={inputCls} defaultValue="">
                <option value="" disabled>
                  Select…
                </option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="PIN code" error={errors.pincode}>
              <input {...register("pincode")} autoComplete="postal-code" inputMode="numeric" maxLength={6} aria-invalid={!!errors.pincode} className={inputCls} />
            </Field>
          </div>
          <Field label="Order note" optional error={errors.note}>
            <textarea {...register("note")} rows={3} className={cn(inputCls, "h-auto py-2")} />
          </Field>
          {copy.sameDayNote && (
            <p className="text-sm">
              <InlineLinks text={copy.sameDayNote} linkClassName="text-chilli underline underline-offset-4" />
            </p>
          )}
        </section>

        {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input {...register("website")} tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <section className="space-y-3">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" {...register("agree")} aria-invalid={!!errors.agree} className="mt-0.5 size-5 shrink-0 accent-chilli" />
            <span>
              I have read and agree to the <PolicyLink {...copy.policies.terms} />, <PolicyLink {...copy.policies.shipping} /> and{" "}
              <PolicyLink {...copy.policies.cancellation} />.
            </span>
          </label>
          <p className="pl-8 text-xs text-ink-muted">
            We handle your details as described in our <PolicyLink {...copy.policies.privacy} />.
          </p>
          {errors.agree?.message && (
            <p role="alert" className="text-xs text-chilli">
              {errors.agree.message}
            </p>
          )}
        </section>

        <div className="space-y-3" aria-live="polite">
          {status.kind === "error" && (
            <p role="alert" className="border-l-2 border-chilli bg-blush/40 px-4 py-3 text-sm">
              {status.message}
            </p>
          )}
          {(status.kind === "cancelled" || status.kind === "failed") && payment && (
            <div role="alert" className="space-y-3 border-l-2 border-chilli bg-blush/40 px-4 py-3 text-sm">
              <p>
                {status.kind === "cancelled"
                  ? `Payment was cancelled. Your order ${payment.orderNumber} is saved — you can try again.`
                  : `${status.message} No money has been taken for order ${payment.orderNumber}. You can try again or use another payment method.`}
              </p>
              <Button onClick={() => void pay(payment)} size="sm">
                Try payment again
              </Button>
            </div>
          )}

          {status.kind !== "cancelled" && status.kind !== "failed" && (
            <Button type="submit" size="lg" fullWidth disabled={busy || !canPay}>
              <Lock className="size-4" aria-hidden />
              {busy ? status.message : quote ? `Pay ${formatINR(quote.total)}` : "Pay"}
            </Button>
          )}
          <p className="text-center text-xs text-ink-muted">
            Payments are processed securely by Razorpay. Questions?{" "}
            {copy.contactEmail && (
              <a href={`mailto:${copy.contactEmail}`} className="underline underline-offset-2">
                Email us
              </a>
            )}
            {copy.contactEmail && copy.whatsappUrl && " or "}
            {copy.whatsappUrl && (
              <a href={copy.whatsappUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                WhatsApp us
              </a>
            )}
          </p>
        </div>
      </form>

      {/* Desktop summary */}
      <aside className="hidden lg:block">
        <div className="sticky top-40 border border-taupe bg-paper/40 p-6">
          <h2 className="mb-5 font-serif text-xl font-semibold">Order summary</h2>
          {summary}
        </div>
      </aside>
    </div>
  );
}

/** Form-shaped placeholder so the footer doesn't jump while the cart loads. */
export function CheckoutSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-14" aria-busy="true">
      <Skeleton className="h-14 w-full lg:hidden" />
      <div className="space-y-4">
        <Skeleton className="h-7 w-32" />
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-[4.25rem] w-full" />
        ))}
      </div>
      <Skeleton className="hidden h-80 w-full lg:block" />
    </div>
  );
}
