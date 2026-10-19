import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";
import { ALL_SETTING_FIELDS } from "@/lib/admin/settings-fields";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Site Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Site Settings" description="Contact details, shipping, social links and the small bits of text used around the shop." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  const admin = await requireAdmin();
  if (!admin) return null;
  const { data } = await admin.supabase.from("site_settings").select("key, value");
  const values: Record<string, string | boolean> = {};
  for (const field of ALL_SETTING_FIELDS) {
    const v = data?.find((r) => r.key === field.key)?.value;
    values[field.key] = field.type === "bool" ? v === true : v == null ? "" : String(v);
  }
  return <SettingsForm initial={values} />;
}
