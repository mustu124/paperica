import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductGridSkeleton } from "@/components/site/product-grid";
import { parseListingParams, resolveCategory, resolveSubcategory } from "@/lib/collections";
import { getCollectionNodes } from "@/lib/data/categories";
import { getMenu } from "@/lib/data/menu";
import { getCatalog } from "@/lib/data/products";
import { getSiteSettings } from "@/lib/data/settings";
import { titleCase } from "@/lib/format";
import { openGraphDefaults } from "@/lib/seo";
import { settingString } from "@/lib/settings";
import { CollectionResults } from "./collection-results";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function displayTitle(nodes: NonNullable<Awaited<ReturnType<typeof getCollectionNodes>>>) {
  return nodes.subcategory ? nodes.subcategory.name : titleCase(nodes.category.name);
}

function canonicalPath(categorySlug: string, subSlug?: string) {
  return subSlug ? `/collections/${categorySlug}/${subSlug}` : `/collections/${categorySlug}`;
}

export async function collectionMetadata(categorySlug: string, subSlug?: string): Promise<Metadata> {
  const [nodes, settings] = await Promise.all([getCollectionNodes(categorySlug, subSlug), getSiteSettings()]);
  if (!nodes) return { title: "Page not found", robots: { index: false, follow: false } };
  const title = displayTitle(nodes);
  const brand = settingString(settings, "brand_name");
  const description =
    nodes.subcategory?.description ??
    (nodes.subcategory ? null : nodes.category.description) ??
    `Shop ${title}${brand ? ` at ${brand}` : ""}${settingString(settings, "tagline") ? ` — ${settingString(settings, "tagline")}` : ""}.`;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath(categorySlug, subSlug) },
    openGraph: { ...openGraphDefaults(settings), title, description },
  };
}

/** Fallback while a collection page streams in. */
export function CollectionSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 md:px-6">
      <div className="mb-8 h-10 w-64 animate-pulse bg-taupe/40" />
      <ProductGridSkeleton count={6} />
    </div>
  );
}

/** Shared page for /collections/[category] and /collections/[category]/[subcategory]. */
export async function CollectionPage({
  categorySlug,
  subSlug,
  searchParams,
}: {
  categorySlug: string;
  subSlug?: string;
  searchParams: SearchParams;
}) {
  const nodes = await getCollectionNodes(categorySlug, subSlug);
  if (!nodes) notFound();
  const { category, subcategory } = nodes;
  // Corporate Gifting / Custom Orders live at their own top-level page.
  if (subcategory?.kind === "content_page") permanentRedirect(`/${subcategory.slug}`);

  const title = displayTitle(nodes);
  const description = subcategory ? subcategory.description : category.description;

  const crumbs = [
    { label: "Home", href: "/" },
    { label: titleCase(category.name), href: subcategory ? category.href : undefined },
    ...(subcategory ? [{ label: subcategory.name }] : []),
  ];

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 md:px-6">
      <Breadcrumbs items={crumbs} className="mb-6" />

      <header className="mb-8 max-w-3xl">
        <h1 className="font-serif text-3xl font-semibold md:text-4xl">{title}</h1>
        {description && <p className="mt-3 text-ink/80">{description}</p>}
      </header>

      <Suspense fallback={<ProductGridSkeleton count={6} />}>
        <Listing
          categorySlug={categorySlug}
          subSlug={subSlug}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}

async function Listing({
  categorySlug,
  subSlug,
  searchParams,
}: {
  categorySlug: string;
  subSlug?: string;
  searchParams: SearchParams;
}) {
  const [raw, nodes, catalog, menu] = await Promise.all([
    searchParams,
    getCollectionNodes(categorySlug, subSlug),
    getCatalog(),
    getMenu(),
  ]);
  if (!nodes) notFound();
  const { category, subcategory } = nodes;
  const params = parseListingParams(raw);

  const ids = subcategory ? resolveSubcategory(subcategory, category, catalog) : resolveCategory(category, catalog);
  const products = catalog.products.filter((p) => ids.has(p.id));


  // Sub chips: the category's other subcategories that actually contain some of these products.
  const chipSets = new Map<string, Set<string>>();
  const chips = category.subcategories
    .filter((s) => s.kind !== "view_all" && s.id !== subcategory?.id)
    .flatMap((s) => {
      const set = resolveSubcategory(s, category, catalog);
      if (!products.some((p) => set.has(p.id))) return [];
      chipSets.set(s.slug, set);
      return [{ slug: s.slug, name: s.name }];
    });

  const firstHead = menu[0];
  return (
    <CollectionResults
      products={products}
      params={params}
      pathname={canonicalPath(categorySlug, subSlug)}
      chips={chips}
      chipSets={chipSets}
      emptyCta={firstHead ? { label: `Browse ${titleCase(firstHead.name)}`, href: firstHead.href } : null}
    />
  );
}
