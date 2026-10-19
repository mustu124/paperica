import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "tag" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 label-button transition-colors " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  // Solid chilli pill: Add to Cart, checkout, form submits.
  primary: "rounded-full bg-chilli text-white shadow-sm hover:bg-chilli-deep active:bg-chilli-deep",
  // Outline: secondary actions, "NEW IN" in an empty cart.
  secondary:
    "rounded-full border border-chilli/60 bg-white text-chilli hover:border-chilli hover:bg-blush/40 active:border-chilli-deep",
  // Small pink "SHOP …" button overlaid on promo images (as on the reference site).
  tag: "rounded-full bg-white/90 text-chilli shadow-sm hover:bg-chilli hover:text-white",
  ghost: "rounded-full text-ink hover:bg-blush/60",
  link: "!tracking-normal normal-case text-sm text-ink underline underline-offset-4 hover:text-chilli",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-11 px-4 lg:h-8",
  md: "h-11 px-6",
  lg: "h-12 px-8 text-[0.8125rem]",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return cn(
    base,
    variants[variant],
    variant === "link" ? "h-auto px-0" : sizes[variant === "tag" ? "sm" : size],
    fullWidth && "w-full",
    className,
  );
}

type StyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & StyleProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}

/** Same styles as Button, rendered as a Next.js link. */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ComponentProps<typeof Link> & StyleProps) {
  return (
    <Link
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
