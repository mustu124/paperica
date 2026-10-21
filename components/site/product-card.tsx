import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Price } from "@/components/ui/price";
import type { ProductCardData } from "@/lib/data/products";
import { cn } from "@/lib/cn";
import { QuickAdd } from "./quick-add";

export type TileTone = "blush" | "paper" | "tint-blue" | "white";

const TONES: Record<TileTone, string> = {
  blush: "bg-blush",
  paper: "bg-paper",
  "tint-blue": "bg-tint-blue",
  white: "bg-white",
};

/**
 * Storefront card: white rounded card, 4:5 image (second image on hover) with corner badges,
 * uppercase name, price and an action pill — Add to cart, Choose options or Customise.
 */
export function ProductCard({
  product,
  priority = false,
  sizes = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
  tone = "blush",
}: {
  product: ProductCardData;
  priority?: boolean;
  sizes?: string;
  tone?: TileTone;
}) {
  const p = product;
  const customisable = p.mode === "whatsapp";
  const action = customisable
    ? { label: "Customise", href: p.href }
    : p.soldOut
      ? null
      : p.hasOptions || p.price == null
        ? { label: "Options", href: p.href }
        : "add";

  return (
    <article className="group flex h-full flex-col rounded-3xl bg-white p-2.5 shadow-[0_6px_18px_-12px_rgb(139_0_0/0.35)] transition-shadow hover:shadow-[0_10px_26px_-12px_rgb(139_0_0/0.45)] sm:p-3">
      <Link href={p.href} tabIndex={-1} aria-hidden className={cn("relative block aspect-[4/5] overflow-hidden rounded-2xl", TONES[tone])}>
        <ImageWithFallback
          src={p.image?.url}
          alt={p.image?.alt ?? p.name}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover transition-opacity duration-500", p.hoverImage && "group-hover:opacity-0")}
        />
        {p.hoverImage && (
          <ImageWithFallback
            src={p.hoverImage.url}
            alt=""
            fill
            sizes={sizes}
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {p.isNew && <Badge variant="new">New</Badge>}
          {p.badgeText && <Badge variant="offer">{p.badgeText}</Badge>}
          {p.offerTag && !p.soldOut && <Badge variant="offer">{p.offerTag}</Badge>}
          {customisable && <Badge variant="neutral">Customisable</Badge>}
          {p.soldOut && <Badge variant="soldout">Sold out</Badge>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <h3 className="text-[0.75rem] font-medium uppercase leading-snug tracking-[0.1em] sm:text-[0.8125rem]">
          <Link href={p.href} className="hover:text-chilli">
            {p.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <Price
            amount={p.price}
            compareAt={customisable ? null : p.compareAt}
            prefix={customisable ? "From" : undefined}
            className="text-base"
          />
          {action === "add" ? (
            <QuickAdd product={p} />
          ) : action ? (
            <Link href={action.href} className={cn(buttonClasses({ size: "sm" }), "shrink-0 px-3 sm:px-4")}>
              {action.label}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
