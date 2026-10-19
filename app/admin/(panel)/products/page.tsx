import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";
import { ProductTable, type ProductListItem } from "./product-table";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Products"
        description="Everything in the shop. Inactive products are hidden from customers."
        actions={
          <ButtonLink href="/admin/products/new" size="lg">
            <Plus className="size-4" aria-hidden />
            Add product
          </ButtonLink>
        }
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Products />
      </Suspense>
    </>
  );
}

async function Products() {
  const admin = await requireAdmin();
  if (!admin) return null;
  const [{ data: products, error }, { data: images }] = await Promise.all([
    admin.supabase
      .from("products")
      .select("id, name, slug, sku, price_inr, stock_qty, track_stock, mode, is_active, is_new, is_best_seller, sort_order")
      .order("sort_order")
      .order("created_at", { ascending: false }),
    admin.supabase.from("product_images").select("product_id, url, sort_order").order("sort_order"),
  ]);
  if (error) return <p className="text-chilli">Couldn&apos;t load products: {error.message}</p>;

  const thumb = new Map<string, string>();
  for (const img of images ?? []) if (!thumb.has(img.product_id)) thumb.set(img.product_id, img.url);
  const items: ProductListItem[] = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    price: p.price_inr == null ? null : Number(p.price_inr),
    stock: p.track_stock ? (p.stock_qty ?? 0) : null,
    mode: p.mode,
    isActive: p.is_active,
    isNew: p.is_new,
    isBestSeller: p.is_best_seller,
    image: thumb.get(p.id) ?? null,
  }));
  return <ProductTable products={items} />;
}
