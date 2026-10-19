import type { Metadata } from "next";
import { Suspense } from "react";
import { CollectionPage, CollectionSkeleton, collectionMetadata } from "@/components/site/collection/collection-page";
import { getCategoryTree } from "@/lib/data/categories";
import { NO_MATCH_PARAM, withFallback } from "@/lib/static-params";

type Props = PageProps<"/collections/[category]">;

export async function generateStaticParams() {
  const tree = await getCategoryTree();
  return withFallback(tree.map((c) => ({ category: c.slug })), { category: NO_MATCH_PARAM });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  return collectionMetadata(category);
}

/** "View All" for a menu head, e.g. /collections/notebooks-journals. */
export default function CategoryPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<CollectionSkeleton />}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: Props) {
  const { category } = await params;
  return <CollectionPage categorySlug={category} searchParams={searchParams} />;
}
