import type { MetadataRoute } from "next";
import { getCategoryTree } from "@/lib/data/categories";
import { getAllPages } from "@/lib/data/pages";
import { getCatalog } from "@/lib/data/products";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// CMS pages that have their own top-level route (slug → path).
const PAGE_ROUTES: Record<string, string> = {
  about: "/about",
  contact: "/contact",
  faq: "/faq",
  "shipping-policy": "/shipping-policy",
  "cancellation-returns-refund-policy": "/cancellation-returns-refund-policy",
  "privacy-policy": "/privacy-policy",
  "terms-and-conditions": "/terms-and-conditions",
  "corporate-gifting": "/corporate-gifting",
  "custom-orders": "/custom-orders",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tree, pages, catalog] = await Promise.all([getCategoryTree(), getAllPages(), getCatalog()]);
  const url = (path: string) => `${SITE}${path}`;

  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    ...tree.flatMap((c) => [
      { url: url(c.href), changeFrequency: "daily" as const, priority: 0.8 },
      ...c.subcategories
        .filter((s) => s.kind !== "view_all" && s.kind !== "content_page")
        .map((s) => ({ url: url(s.href), changeFrequency: "daily" as const, priority: 0.7 })),
    ]),
    ...catalog.products.map((p) => ({
      url: url(`/products/${p.slug}`),
      lastModified: p.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...pages
      .filter((p) => PAGE_ROUTES[p.slug])
      .map((p) => ({
        url: url(PAGE_ROUTES[p.slug]),
        lastModified: p.updated_at,
        changeFrequency: "monthly" as const,
        priority: 0.4,
      })),
    { url: url("/track-order"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
