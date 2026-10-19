import type { MetadataRoute } from "next";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  // Preview deployments (*.vercel.app test builds) must never be indexed.
  if (process.env.VERCEL_ENV === "preview") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/styleguide", "/checkout", "/order-confirmation", "/search"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
