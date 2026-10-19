import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

const SITE = siteUrl();

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
