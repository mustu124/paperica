import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const isPlaceholder = (url: unknown) => typeof url === "string" && url.startsWith("/placeholders/");

/**
 * Pre-launch reminder on Admin → Orders (the admin home) while seeded sample content is still live:
 * products named "[Replace me] …" and images from /public/placeholders. Disappears once replaced.
 */
export async function PlaceholderNotice({ supabase }: { supabase: Supabase }) {
  const [products, productImages, homepage, categories] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true).ilike("name", "%replace me%"),
    supabase.from("product_images").select("id", { count: "exact", head: true }).like("url", "/placeholders/%"),
    supabase.from("homepage_assets").select("id", { count: "exact", head: true }).like("image_url", "/placeholders/%"),
    supabase.from("categories").select("image_url, menu_feature_images"),
  ]);

  const categoryImages = (categories.data ?? []).reduce((n, c) => {
    const features = Array.isArray(c.menu_feature_images) ? c.menu_feature_images : [];
    return n + (isPlaceholder(c.image_url) ? 1 : 0) + features.filter((f) => isPlaceholder((f as { url?: unknown })?.url)).length;
  }, 0);

  const items = [
    { count: products.count ?? 0, text: "sample products are live", href: "/admin/products", link: "Products" },
    { count: productImages.count ?? 0, text: "product photos are placeholders", href: "/admin/products", link: "Products" },
    { count: homepage.count ?? 0, text: "homepage images are placeholders", href: "/admin/homepage", link: "Homepage" },
    { count: categoryImages, text: "category / menu images are placeholders", href: "/admin/categories", link: "Categories & Menu" },
  ].filter((i) => i.count > 0);
  if (items.length === 0) return null;

  return (
    <aside role="note" className="rounded-lg border border-chilli/30 bg-blush/50 p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold text-chilli-deep">
        <TriangleAlert className="size-4 shrink-0" aria-hidden />
        Before launch: replace the sample content
      </p>
      <p className="mt-1 text-ink-muted">Anything marked “Replace me” came with the starter data and isn’t real.</p>
      <ul className="mt-2 space-y-1">
        {items.map((i) => (
          <li key={i.text} className="flex flex-wrap items-center gap-x-2">
            <span>
              <strong>{i.count}</strong> {i.text}
            </span>
            <Link href={i.href} className="inline-flex min-h-11 items-center text-chilli underline underline-offset-2 lg:min-h-0">
              {i.link} →
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
