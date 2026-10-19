import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderTokens } from "@/lib/content";
import { excerpt, getAllPages, getPage } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/settings";
import { openGraphDefaults } from "@/lib/seo";
import { ContentShell, Prose } from "./content-shell";

/** Policy routes (URL = page slug). Order is the order of the "Related policies" list. */
export const POLICY_SLUGS = [
  "shipping-policy",
  "cancellation-returns-refund-policy",
  "privacy-policy",
  "terms-and-conditions",
] as const;

export async function contentMetadata(slug: string, path = `/${slug}`): Promise<Metadata> {
  const [page, settings] = await Promise.all([getPage(slug), getSiteSettings()]);
  if (!page) return {};
  const description = excerpt(renderTokens(page.body_html, settings));
  return {
    title: page.title,
    description: description || undefined,
    alternates: { canonical: path },
    openGraph: { ...openGraphDefaults(settings), title: page.title, description: description || undefined, type: "article" },
  };
}

/** A legal/policy page: title, "Last updated" (pages.effective_date), numbered sections, related policies. */
export async function PolicyPage({ slug }: { slug: (typeof POLICY_SLUGS)[number] }) {
  const [page, settings, pages] = await Promise.all([getPage(slug), getSiteSettings(), getAllPages()]);
  if (!page) notFound();
  const related = POLICY_SLUGS.filter((s) => s !== slug).flatMap((s) => {
    const p = pages.find((x) => x.slug === s);
    return p ? [{ href: `/${s}`, title: p.title }] : [];
  });

  return (
    <ContentShell title={page.title} lastUpdated={page.effective_date}>
      <Prose html={renderTokens(page.body_html, settings)} />
      {related.length > 0 && (
        <nav aria-label="Related policies" className="mt-14 border-t border-taupe pt-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="inline-flex min-h-11 items-center text-chilli underline-offset-4 hover:underline lg:min-h-0">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </ContentShell>
  );
}
