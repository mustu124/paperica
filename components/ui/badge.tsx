import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "new" | "offer" | "sale" | "soldout" | "neutral";

const variants: Record<BadgeVariant, string> = {
  new: "bg-stem-deep text-white",          // NEW
  offer: "bg-white text-chilli-deep shadow-sm", // bundle / offer, e.g. "3 FOR ₹999"
  sale: "bg-chilli text-white",            // price drop
  soldout: "bg-ink text-white",
  neutral: "bg-paper text-ink",
};

/** Small rounded label, as in the corner of product cards. */
export function Badge({
  variant = "new",
  className,
  ...props
}: ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-[0.625rem] font-medium uppercase leading-none tracking-[0.12em]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
