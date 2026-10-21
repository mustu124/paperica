"use client";

import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { ScribbleCircle } from "@/components/ui/scribble-circle";
import { Gift } from "lucide-react";
import { formatINR } from "@/lib/format";
import { useCart } from "./cart-provider";

/** Slide-in cart. Empty and filled states mirror the reference layout. */
export function CartDrawer({
  cartMessage,
  offerText,
  emptyCta,
}: {
  cartMessage: string;
  /** Free gift offer, when it's switched on (applied at checkout). */
  offerText: string;
  emptyCta: { label: string; href: string } | null;
}) {
  const { items, subtotal, isOpen, close, setQty, remove } = useCart();
  const empty = items.length === 0;

  return (
    <Drawer
      open={isOpen}
      onClose={close}
      title="Your cart"
      footer={
        empty ? undefined : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-base">
              <span>Subtotal</span>
              <span className="font-medium">{formatINR(subtotal)}</span>
            </div>
            {offerText && (
              <p className="flex items-start gap-2 rounded-md bg-butter/70 px-3 py-2 text-xs">
                <Gift className="mt-px size-4 shrink-0 text-chilli" aria-hidden />
                <span>{offerText} — added at checkout.</span>
              </p>
            )}
            <p className="text-xs text-ink-muted">
              {cartMessage || "Shipping calculated at checkout."}
            </p>
            <ButtonLink href="/checkout" size="lg" fullWidth onClick={close}>
              Checkout
            </ButtonLink>
          </div>
        )
      }
    >
      {empty ? (
        <div className="relative isolate flex h-full flex-col items-center justify-center gap-2 text-center">
          <ScribbleCircle className="absolute left-1/2 top-1/2 -z-10 size-80 -translate-x-1/2 -translate-y-1/2" />
          <p className="font-serif text-2xl font-semibold">Your cart is empty</p>
          <p className="text-sm font-semibold">Check out what&apos;s new</p>
          {emptyCta && (
            <ButtonLink href={emptyCta.href} variant="secondary" className="mt-4 min-w-44" onClick={close}>
              {emptyCta.label}
            </ButtonLink>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-taupe">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 py-4 first:pt-0">
              <Link
                href={`/products/${item.slug}`}
                onClick={close}
                className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-blush"
              >
                {item.image && (
                  <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={close}
                    className="text-sm leading-snug hover:text-chilli"
                  >
                    {item.name}
                  </Link>
                  <span className="shrink-0 text-sm">{formatINR(item.unitPrice * item.qty)}</span>
                </div>
                {item.variantLabel && <p className="text-xs text-ink-muted">{item.variantLabel}</p>}
                <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                  <QuantityStepper
                    value={item.qty}
                    onChange={(qty) => setQty(item.key, qty)}
                    max={item.maxQty ?? 99}
                    size="sm"
                    hideLabel
                    label={`Quantity for ${item.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => remove(item.key)}
                    className="text-xs text-ink-muted underline underline-offset-4 hover:text-chilli"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
