import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";
import { EDITABLE_PAGES, TOKEN_HELP } from "@/lib/admin/tokens";
import { renderTokensText } from "@/lib/content";
import { parseFormConfig } from "@/lib/enquiry-forms";
import { AboutForm, PageForm } from "./page-form";

export const metadata: Metadata = { title: "Edit page" };

type Props = { params: Promise<{ slug: string }> };

export default function EditPage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] w-full" />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Props) {
  const { slug } = await params;
  const meta = EDITABLE_PAGES.find((p) => p.slug === slug);
  if (!meta) notFound();
  const admin = await requireAdmin();
  if (!admin) return null;

  const [{ data: page }, { data: settingRows }] = await Promise.all([
    admin.supabase.from("pages").select("*").eq("slug", slug).maybeSingle(),
    admin.supabase.from("site_settings").select("key, value"),
  ]);
  if (!page) notFound();
  const settings = Object.fromEntries((settingRows ?? []).map((r) => [r.key, r.value]));
  const str = (k: string) => (typeof settings[k] === "string" ? (settings[k] as string) : "");
  const tokens = TOKEN_HELP.map((t) => ({ ...t, value: renderTokensText(`{{${t.token}}}`, settings) }));

  if (slug === "about") {
    return (
      <AboutForm
        path={meta.path}
        tokens={tokens}
        initial={{
          title: page.title,
          about_intro_html: str("about_intro_html"),
          founder_story_html: str("founder_story_html"),
          mission_html: str("mission_html"),
        }}
      />
    );
  }

  return (
    <PageForm
      slug={slug}
      label={meta.label}
      path={meta.path}
      enquiry={Boolean(meta.enquiry)}
      tokens={tokens}
      initial={{
        title: page.title,
        body_html: page.body_html,
        effective_date: page.effective_date,
        cta_label: page.cta_label ?? "",
        cta_whatsapp_message: page.cta_whatsapp_message ?? "",
        cta_email_subject: page.cta_email_subject ?? "",
      }}
      form={meta.enquiry ? parseFormConfig(page.form_config) : null}
    />
  );
}
