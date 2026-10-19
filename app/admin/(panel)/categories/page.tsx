import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";
import type { MenuFeatureImage } from "@/types/db";
import { CategoryEditor } from "./category-editor";

export const metadata: Metadata = { title: "Categories & Menu" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Categories & Menu"
        description="The six menu heads and their subcategories. Web addresses stay the same when you rename things."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Categories />
      </Suspense>
    </>
  );
}

async function Categories() {
  const admin = await requireAdmin();
  if (!admin) return null;
  const [{ data: cats }, { data: subs }] = await Promise.all([
    admin.supabase.from("categories").select("*").order("sort_order"),
    admin.supabase.from("subcategories").select("*").order("sort_order"),
  ]);
  const list = cats ?? [];
  return (
    <div className="space-y-6">
      {list.map((c, i) => (
        <CategoryEditor
          key={c.id}
          isFirst={i === 0}
          isLast={i === list.length - 1}
          category={{
            id: c.id,
            name: c.name,
            slug: c.slug,
            showInMenu: c.show_in_menu,
            description: c.description ?? "",
            imageUrl: c.image_url,
            features: (Array.isArray(c.menu_feature_images) ? (c.menu_feature_images as MenuFeatureImage[]) : []).map((f) => ({
              url: f.url,
              alt: f.alt ?? "",
              label: f.label ?? "",
              link_url: f.link_url ?? "",
            })),
          }}
          subcategories={(subs ?? [])
            .filter((s) => s.category_id === c.id)
            .map((s) => ({ id: s.id, name: s.name, slug: s.slug, kind: s.kind, description: s.description ?? "" }))}
        />
      ))}
    </div>
  );
}
