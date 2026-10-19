"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductCardData } from "@/lib/data/products";
import { useCart } from "./cart-provider";

/** "Add to cart" straight from a product card (only for buy-online products without options). */
export function QuickAdd({ product }: { product: ProductCardData }) {
  const { add } = useCart();
  if (product.price == null) return null;
  return (
    <Button
      size="sm"
      aria-label={`Add ${product.name} to cart`}
      onClick={() =>
        add({
          productId: product.id,
          variantId: null,
          slug: product.slug,
          name: product.name,
          variantLabel: null,
          unitPrice: product.price as number,
          image: product.image?.url ?? null,
          maxQty: product.maxQty,
          mode: product.mode,
        })
      }
      className="shrink-0 px-3 sm:px-4"
    >
      <ShoppingBag className="size-3.5 sm:hidden" aria-hidden />
      <span className="sm:hidden">Add</span>
      <span className="hidden sm:inline">Add to cart</span>
    </Button>
  );
}
