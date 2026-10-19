import type { Metadata } from "next";
import { Search } from "lucide-react";
import { Suspense } from "react";
import { CollectionResults } from "@/components/site/collection/collection-results";
import { ProductGridSkeleton } from "@/components/site/product-grid";
import { parseListingParams } from "@/lib/collections";
import { getMenu } from "@/lib/data/menu";
import { getCatalog, matchProducts } from "@/lib/data/products";
import { titleCase } from "@/lib/format";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

type Props = Pick<PageProps<"/search">, "searchParams">;

async function SearchForm({ searchParams }: Props) {
  const { q } = parseListingParams(await searchParams);
  return (
    <form role="search" action="/search" className="mx-auto flex max-w-lg">
      <label htmlFor="search-page-q" className="sr-only">
        Search products
      </label>
      <input
        id="search-page-q"
        name="q"
        type="search"
        defaultValue={q}
        placeholder="Search notebooks, planners, gifts…"
        className="h-11 min-w-0 flex-1 border border-r-0 border-ink/30 px-4 focus:border-chilli focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex size-11 items-center justify-center bg-blush hover:bg-chilli hover:text-white"
      >
        <Search className="size-5" aria-hidden />
      </button>
    </form>
  );
}

async function Results({ searchParams }: Props) {
  const [raw, catalog, menu] = await Promise.all([searchParams, getCatalog(), getMenu()]);
  const params = parseListingParams(raw);
  if (params.q.length < 2) {
    return <p className="text-center text-sm text-ink-muted">Type at least two characters to search.</p>;
  }
  const firstHead = menu[0];
  return (
    <CollectionResults
      products={matchProducts(catalog.products, params.q)}
      params={params}
      pathname="/search"
      emptyMessage={`No results for “${params.q}”`}
      emptyCta={firstHead ? { label: `Browse ${titleCase(firstHead.name)}`, href: firstHead.href } : null}
    />
  );
}

export default function SearchPage({ searchParams }: Props) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-10 md:px-6">
      <h1 className="mb-6 text-center font-serif text-3xl font-semibold md:text-4xl">Search</h1>
      <Suspense fallback={<div className="mx-auto h-11 max-w-lg" />}>
        <SearchForm searchParams={searchParams} />
      </Suspense>
      <div className="mt-10">
        <Suspense fallback={<ProductGridSkeleton count={6} />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
