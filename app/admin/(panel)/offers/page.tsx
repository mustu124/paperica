import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";
import { titleCase } from "@/lib/format";
import { getOffers } from "@/lib/offer";
import { OffersForm, type ScopeOption } from "./offers-form";

export const metadata: Metadata = { title: "Offers" };

export default function OffersPage() {
  return (
    <>
      <PageHeader
        title="Offers"
        description="Free-gift offers: when a customer buys enough of the chosen products, the free product is added to their order at checkout."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Offers />
      </Suspense>
    </>
  );
}

async function Offers() {
  const admin = await requireAdmin();
  if (!admin) return null;
  const [{ data: settingRows }, { data: cats }, { data: subs }, { data: products }] = await Promise.all([
    admin.supabase.from("site_settings").select("key, value"),
    admin.supabase.from("categories").select("id, name, sort_order").order("sort_order"),
    admin.supabase.from("subcategories").select("id, category_id, name, kind, sort_order").order("sort_order"),
    admin.supabase.from("products").select("id, name, slug, mode, is_active").eq("mode", "buy").order("name"),
  ]);

  const settings = Object.fromEntries((settingRows ?? []).map((r) => [r.key, r.value]));
  const productList = (products ?? []).map((p) => ({ id: p.id, name: p.name, slug: p.slug, hidden: !p.is_active }));
  // Older offers point at the free product by its web address: resolve it to the product.
  const offers = getOffers(settings).map((o) =>
    o.gift_product_id ? o : { ...o, gift_product_id: productList.find((p) => p.slug === o.gift_slug)?.id ?? null },
  );

  const scopes: ScopeOption[] = [
    { group: "Special", value: "new", label: "Products marked New", phrase: "from the New Collection" },
    ...(cats ?? []).map((c) => ({
      group: "Whole menu section",
      value: `category:${c.id}`,
      label: titleCase(c.name),
      phrase: `from ${titleCase(c.name)}`,
    })),
    ...(cats ?? []).flatMap((c) =>
      (subs ?? [])
        .filter((s) => s.category_id === c.id && s.kind === "manual")
        .map((s) => ({ group: titleCase(c.name), value: `subcategory:${s.id}`, label: s.name, phrase: `from ${s.name}` })),
    ),
  ];

  return <OffersForm initial={offers} scopes={scopes} products={productList} />;
}
