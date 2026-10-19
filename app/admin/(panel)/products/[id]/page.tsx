import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";
import { loadCategoryOptions, loadProduct } from "../load";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Edit product" };

type Props = { params: Promise<{ id: string }> };

export default function EditProductPage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] w-full" />}>
      <EditProduct params={params} />
    </Suspense>
  );
}

async function EditProduct({ params }: Props) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return null;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [product, categories] = await Promise.all([loadProduct(admin.supabase, id), loadCategoryOptions(admin.supabase)]);
  if (!product) notFound();
  // key: remount with fresh state after "Duplicate" navigates to another product.
  return <ProductForm key={id} id={id} initial={product} categories={categories} />;
}
