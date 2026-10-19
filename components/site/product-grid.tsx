import { ProductTileSkeleton } from "@/components/ui/skeleton";
import type { ProductCardData } from "@/lib/data/products";
import { ProductCard } from "./product-card";

/** 2 / 3 / 4-column product grid used by collections and search. */
export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductTileSkeleton key={i} />
      ))}
    </div>
  );
}
