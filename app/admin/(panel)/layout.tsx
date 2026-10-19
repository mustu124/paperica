import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

async function Shell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  const { data } = await admin.supabase.from("site_settings").select("value").eq("key", "brand_name").maybeSingle();
  const brand = typeof data?.value === "string" && data.value ? data.value : "Admin";
  return (
    <AdminShell brand={brand} email={admin.user.email ?? ""}>
      {children}
    </AdminShell>
  );
}

/** Every admin page (except /admin/login) renders inside the sidebar shell, after an admin check. */
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
