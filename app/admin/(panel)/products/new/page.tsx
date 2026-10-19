import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";
import { EMPTY_PRODUCT, loadCategoryOptions } from "../load";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] w-full" />}>
      <NewProduct />
    </Suspense>
  );
}

async function NewProduct() {
  const admin = await requireAdmin();
  if (!admin) return null;
  const categories = await loadCategoryOptions(admin.supabase);
  return <ProductForm id={null} initial={EMPTY_PRODUCT} categories={categories} />;
}
