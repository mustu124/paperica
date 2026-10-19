import Link from "next/link";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { ScribbleCircle } from "@/components/ui/scribble-circle";
import {
  PAGE_SIZE,
  activeFilterCount,
  applyFilters,
  listingQuery,
  sortProducts,
  type ListingParams,
} from "@/lib/collections";
import { getProductCards, getSalesCounts, type ProductRow } from "@/lib/data/products";
import { ProductCard } from "../product-card";
import { FilterDrawer, type SubChip } from "./filter-drawer";
import { DensityGrid, DensityToggle } from "./grid-density";
import { SortSelect } from "./sort-select";

/**
 * Toolbar (Filter · N Results · density · Sort), product grid and "Load more".
 * Filtering, sorting and pagination come from the URL, so every state is linkable.
 */
export async function CollectionResults({
  products,
  params,
  pathname,
  chips = [],
  chipSets = new Map(),
  emptyCta,
  emptyMessage = "Nothing here just yet",
}: {
  products: ProductRow[];
  params: ListingParams;
  pathname: string;
  chips?: SubChip[];
  chipSets?: Map<string, Set<string>>;
  emptyCta: { label: string; href: string } | null;
  emptyMessage?: string;
}) {
  const filtered = applyFilters(products, params, chipSets);
  const sales = params.sort === "best-selling" ? await getSalesCounts() : {};
  const sorted = sortProducts(filtered, params.sort, sales);
  const visible = sorted.slice(0, params.page * PAGE_SIZE);
  const cards = await getProductCards(visible.map((p) => p.id));

  const prices = products.map((p) => p.price).filter((n): n is number => n != null);
  const priceBounds = prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null;
  const filters = activeFilterCount(params);
  const clearHref = pathname + listingQuery(params, { min: null, max: null, inStock: false, type: null, subs: [], page: 1 });
  const total = filtered.length;

  return (
    <div>
      <div className="sticky top-[var(--header-h,0px)] z-20 -mx-4 mb-6 flex items-center justify-between gap-3 border-y border-chilli/15 bg-cream px-4 py-2 md:-mx-6 md:px-6 lg:static lg:mx-0 lg:px-0 lg:py-3">
        <div className="flex items-center gap-4">
          <FilterDrawer
            params={params}
            chips={chips}
            activeCount={filters}
            priceBounds={priceBounds}
            clearHref={clearHref}
          />
          <p className="text-sm text-ink-muted" role="status">
            {total} {total === 1 ? "Result" : "Results"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DensityToggle />
          <SortSelect value={params.sort} />
        </div>
      </div>

      {total === 0 ? (
        <div className="relative isolate mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
          <ScribbleCircle className="absolute left-1/2 top-1/2 -z-10 size-80 -translate-x-1/2 -translate-y-1/2" />
          <p className="font-serif text-2xl font-semibold md:text-3xl">
            {filters > 0 ? "No products match these filters" : emptyMessage}
          </p>
          <p className="text-sm text-ink-muted">
            {filters > 0 ? "Try removing a filter or two." : "New pieces are on their way — have a look at what's new in the meantime."}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {filters > 0 && (
              <Link href={clearHref} scroll={false} className={buttonClasses({ variant: "secondary" })}>
                Clear filters
              </Link>
            )}
            {emptyCta && (
              <ButtonLink href={emptyCta.href} variant={filters > 0 ? "primary" : "secondary"}>
                {emptyCta.label}
              </ButtonLink>
            )}
          </div>
        </div>
      ) : (
        <>
          <DensityGrid>
            {cards.map((p, i) => (
              <li key={p.id}>
                <ProductCard
                  product={p}
                  priority={i < 3}
                  sizes="(min-width: 1440px) 460px, (min-width: 1024px) 33vw, 50vw"
                />
              </li>
            ))}
          </DensityGrid>

          <div className="mt-12 flex flex-col items-center gap-3">
            <p className="text-xs text-ink-muted">
              Showing {visible.length} of {total}
            </p>
            {visible.length < total && (
              <Link
                href={pathname + listingQuery(params, { page: params.page + 1 })}
                scroll={false}
                className={buttonClasses({ variant: "secondary", className: "min-w-48" })}
              >
                Load more
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
