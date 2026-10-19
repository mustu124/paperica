"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "../cart-provider";

/** Bag icon with item-count badge; opens the cart drawer. */
export function CartButton() {
  const { count, open } = useCart();
  return (
    <button
      type="button"
      onClick={open}
      aria-haspopup="dialog"
      aria-label={count > 0 ? `Open cart, ${count} item${count === 1 ? "" : "s"}` : "Open cart"}
      className="relative -mr-2 flex size-11 items-center justify-center text-ink hover:text-chilli"
    >
      <ShoppingBag className="size-6" strokeWidth={1.5} aria-hidden />
      <span
        aria-hidden
        className="absolute right-0 top-0.5 flex min-w-[1.125rem] items-center justify-center rounded-full bg-chilli px-1 text-[0.625rem] font-semibold leading-[1.125rem] text-white ring-2 ring-blush"
      >
        {count > 99 ? "99+" : count}
      </span>
    </button>
  );
}
