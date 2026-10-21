import type { Metadata } from "next";
import { Suspense } from "react";
import { CollectionPage, CollectionSkeleton, collectionMetadata } from "@/components/site/collection/collection-page";
import { getCategoryTree } from "@/lib/data/categories";
import { NO_MATCH_PARAM, withFallback } from "@/lib/static-params";

type Props = PageProps<"/collections/[category]/[subcategory]">;

export async function generateStaticParams() {
  const tree = await getCategoryTree();
  return withFallback(
    tree.flatMap((c) =>
      // content_page and linked entries are included so their redirects are prerendered (a real 30x).
      c.subcategories.filter((s) => s.kind !== "view_all").map((s) => ({ category: c.slug, subcategory: s.slug })),
    ),
    { category: NO_MATCH_PARAM, subcategory: NO_MATCH_PARAM },
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, subcategory } = await params;
  return collectionMetadata(category, subcategory);
}

/** A subcategory, e.g. /collections/gifts/gifts-under-1000. */
export default function SubcategoryPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<CollectionSkeleton />}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: Props) {
  const { category, subcategory } = await params;
  return <CollectionPage categorySlug={category} subSlug={subcategory} searchParams={searchParams} />;
}
