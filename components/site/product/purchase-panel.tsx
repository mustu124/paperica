"use client";

import { useRouter } from "next/navigation";
import { Flame, Package, Truck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { cn } from "@/lib/cn";
import { customiseProductMessage, whatsappUrl } from "@/lib/whatsapp";
import type { ProductMode } from "@/types/db";
import { useCart } from "../cart-provider";
import { InlineLinks } from "../inline-links";

export type PanelVariant = {
  id: string;
  label: string;
  group: string;
  priceOverride: number | null;
  stockQty: number | null;
};

export type PanelProduct = {
  id: string;
  slug: string;
  name: string;
  url: string; // absolute product URL (used in the WhatsApp message)
  mode: ProductMode;
  price: number | null;
  compareAt: number | null;
  isNew: boolean;
  trackStock: boolean;
  stockQty: number | null;
  lowStockMessage: string | null;
  image: string | null;
};

export type PanelCopy = {
  lowStockThreshold: number;
  lowStockMessage: string;
  deliveryBadges: string[];
  priceNote: string;
  paymentNote: string;
  whatsappNumber: string;
  whatsappTemplate: string;
  personalisedInfo: string;
};

/** Right-hand column of the product page: title, urgency, delivery, variants, price, purchase area. */
export function PurchasePanel({
  product,
  variants,
  copy,
}: {
  product: PanelProduct;
  variants: PanelVariant[];
  copy: PanelCopy;
}) {
  const router = useRouter();
  const { add } = useCart();
  const isWhatsapp = product.mode === "whatsapp";

  const variantSoldOut = (v: PanelVariant) => product.trackStock && v.stockQty != null && v.stockQty <= 0;
  const [variantId, setVariantId] = useState<string | null>(
    () => (variants.find((v) => !variantSoldOut(v)) ?? variants[0])?.id ?? null,
  );
  const [qty, setQty] = useState(1);
  const variant = variants.find((v) => v.id === variantId) ?? null;

  // Stock for the current selection (null = not tracked / unlimited).
  const available = product.trackStock ? (variant?.stockQty ?? product.stockQty ?? 0) : null;
  const soldOut = !isWhatsapp && available !== null && available <= 0;
  const lowStock = !isWhatsapp && available !== null && available > 0 && available <= copy.lowStockThreshold;
  const price = variant?.priceOverride ?? product.price;
  const variantLabel = variant ? `${variant.group}: ${variant.label}` : null;

  const groups = useMemo(() => {
    const map = new Map<string, PanelVariant[]>();
    for (const v of variants) map.set(v.group, [...(map.get(v.group) ?? []), v]);
    return [...map.entries()];
  }, [variants]);

  const waHref = copy.whatsappNumber
    ? whatsappUrl(
        copy.whatsappNumber,
        customiseProductMessage({ template: copy.whatsappTemplate, name: product.name, variant: variantLabel, url: product.url }),
      )
    : null;

  const addToCart = () =>
    add({
      productId: product.id,
      variantId: variant?.id ?? null,
      slug: product.slug,
      name: product.name,
      variantLabel,
      unitPrice: price ?? 0,
      image: product.image,
      maxQty: available,
      qty,
      mode: product.mode,
    });

  const buyNow = () => {
    const qs = new URLSearchParams({ buy: product.id, qty: String(qty) });
    if (variant) qs.set("variant", variant.id);
    router.push(`/checkout?${qs}`);
  };

  // Mobile sticky bar: shown once the main button has scrolled above the viewport.
  const primaryRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const el = primaryRef.current;
    if (!el) return;
    // A scroll check (not IntersectionObserver): a jump from "below the fold" straight to
    // "scrolled past" never intersects, so an observer would miss it.
    let frame = 0;
    const update = () => {
      frame = 0;
      setShowSticky(el.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  useEffect(() => {
    document.body.dataset.stickyBuy = showSticky ? "1" : "";
    return () => {
      document.body.dataset.stickyBuy = "";
    };
  }, [showSticky]);

  const priceEl = (size: "sm" | "lg") => (
    <Price
      amount={price}
      compareAt={isWhatsapp ? null : product.compareAt}
      prefix={isWhatsapp ? "Starting from" : undefined}
      size={size}
      className="justify-start"
    />
  );

  const primaryButton = (sticky = false) =>
    isWhatsapp ? (
      waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            // Without NEXT_PUBLIC_SITE_URL the product link is relative; make it absolute here.
            if (!product.url.startsWith("http")) {
              e.currentTarget.href = whatsappUrl(
                copy.whatsappNumber,
                customiseProductMessage({
                  template: copy.whatsappTemplate,
                  name: product.name,
                  variant: variantLabel,
                  url: window.location.origin + product.url,
                }),
              );
            }
          }}
          className={buttonClasses({ size: "lg", fullWidth: true })}
        >
          <WhatsAppIcon />
          Customise on WhatsApp
        </a>
      ) : null
    ) : soldOut ? (
      <Button size="lg" fullWidth disabled>
        Sold out
      </Button>
    ) : (
      <Button size="lg" fullWidth onClick={addToCart} className={sticky ? "px-4" : undefined}>
        Add to cart
      </Button>
    );

  return (
    <div className="flex flex-col gap-5">
      <div>
        {product.isNew && (
          <Badge variant="new" className="mb-3">
            New
          </Badge>
        )}
        <h1 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">{product.name}</h1>
      </div>

      {lowStock && (
        <p className="flex items-center gap-2 text-sm text-chilli">
          <Flame className="size-4" aria-hidden />
          {product.lowStockMessage || copy.lowStockMessage}
        </p>
      )}

      {!isWhatsapp && copy.deliveryBadges.length > 0 && (
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {copy.deliveryBadges.map((text, i) => {
            const Icon = i === 0 ? Package : Truck;
            return (
              <li key={i} className="flex items-center gap-2">
                <Icon className="size-4 shrink-0" strokeWidth={1.6} aria-hidden />
                {text}
              </li>
            );
          })}
        </ul>
      )}

      {groups.map(([group, options]) => (
        <fieldset key={group}>
          <legend className="mb-2 text-sm">
            {group}: <span className="text-ink-muted">{variant?.group === group ? variant.label : ""}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {options.map((v) => {
              const out = !isWhatsapp && variantSoldOut(v);
              const selected = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setVariantId(v.id);
                    setQty(1);
                  }}
                  aria-pressed={selected}
                  aria-label={out ? `${v.label} (sold out)` : v.label}
                  className={cn(
                    "relative min-h-11 min-w-14 overflow-hidden rounded-full border bg-white px-5 py-2 text-sm transition-colors",
                    selected ? "border-chilli text-chilli ring-1 ring-chilli" : "border-ink/25 hover:border-chilli",
                    out && "text-ink-muted/60",
                  )}
                >
                  {v.label}
                  {out && (
                    // Diagonal strike-through, like the reference's sold-out size chips.
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top_right,transparent_calc(50%-0.5px),currentColor_50%,transparent_calc(50%+0.5px))]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div>
        {priceEl("lg")}
        {!isWhatsapp && copy.priceNote && (
          <p className="mt-1 text-xs text-ink-muted">
            <InlineLinks text={copy.priceNote} linkClassName="underline underline-offset-2 hover:text-chilli" />
          </p>
        )}
      </div>

      {isWhatsapp ? (
        <div className="flex flex-col gap-4">
          <div ref={primaryRef}>{primaryButton()}</div>
          {copy.personalisedInfo && (
            <p className="border-l-2 border-chilli bg-paper px-4 py-3 text-sm leading-relaxed">{copy.personalisedInfo}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {!soldOut && (
            <QuantityStepper value={qty} onChange={setQty} max={available ?? 99} />
          )}
          <div ref={primaryRef}>{primaryButton()}</div>
          {!soldOut && (
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={buyNow}
              className="border-ink bg-ink text-white hover:border-chilli-deep hover:bg-chilli-deep hover:text-white"
            >
              Buy now
            </Button>
          )}
          {copy.paymentNote && <p className="text-center text-xs text-ink-muted">{copy.paymentNote}</p>}
        </div>
      )}

      {/* Mobile sticky purchase bar */}
      <div
        aria-hidden={!showSticky}
        inert={!showSticky}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-taupe bg-white px-4 py-3 shadow-[0_-4px_16px_-8px_rgb(43_26_26/0.3)] transition-transform duration-300 md:hidden",
          showSticky ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="min-w-0 shrink-0">{priceEl("sm")}</div>
        <div className="min-w-0 flex-1">{primaryButton(true)}</div>
      </div>
    </div>
  );
}
