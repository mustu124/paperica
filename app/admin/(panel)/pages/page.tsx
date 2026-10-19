import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Suspense } from "react";
import { Card, PageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";
import { EDITABLE_PAGES } from "@/lib/admin/tokens";
import { formatDate } from "@/lib/format";
import { FaqManager } from "./faq-manager";

export const metadata: Metadata = { title: "Pages & FAQs" };

export default function PagesAdmin() {
  return (
    <>
      <PageHeader title="Pages & FAQs" description="Edit the text of your About, policy and enquiry pages, and your FAQs." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  const admin = await requireAdmin();
  if (!admin) return null;
  const [{ data: pages }, { data: faqs }] = await Promise.all([
    admin.supabase.from("pages").select("slug, title, updated_at, effective_date"),
    admin.supabase.from("faqs").select("*").order("sort_order"),
  ]);

  return (
    <div className="space-y-8">
      <Card title="Pages">
        <ul className="divide-y divide-taupe/70">
          {EDITABLE_PAGES.map((p) => {
            const row = pages?.find((x) => x.slug === p.slug);
            return (
              <li key={p.slug}>
                <Link href={`/admin/pages/${p.slug}`} className="group flex items-center justify-between gap-4 py-3">
                  <span>
                    <span className="font-medium group-hover:text-chilli">{p.label}</span>
                    <span className="block text-xs text-ink-muted">
                      {p.path}
                      {row && ` · edited ${formatDate(row.updated_at)}`}
                      {row?.effective_date && ` · “Last updated” ${formatDate(row.effective_date)}`}
                    </span>
                  </span>
                  <ChevronRight className="size-5 text-ink-muted group-hover:text-chilli" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>

      <FaqManager
        faqs={(faqs ?? []).map((f) => ({
          id: f.id,
          group: f.group_name,
          question: f.question,
          answer: f.answer_html,
          active: f.is_active,
        }))}
      />
    </div>
  );
}
