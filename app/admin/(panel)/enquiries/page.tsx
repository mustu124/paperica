import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";
import { enquiryTypeLabel } from "@/lib/enquiry";
import { cn } from "@/lib/cn";
import { EnquiryActions } from "./enquiry-row";

export const metadata: Metadata = { title: "Enquiries" };

const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

/** Contact-form messages (RLS: admins only). Personalised-order enquiries go to WhatsApp, not here. */
export default function EnquiriesPage() {
  return (
    <>
      <PageHeader title="Enquiries" description="Messages from the Contact page. Personalised-order enquiries arrive on WhatsApp instead." />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <EnquiryList />
      </Suspense>
    </>
  );
}

async function EnquiryList() {
  const admin = await requireAdmin();
  if (!admin) return null;
  const { data, error } = await admin.supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(300);

  if (error) return <p className="text-chilli">Couldn&apos;t load enquiries: {error.message}</p>;
  if (!data.length) return <EmptyState>No enquiries yet.</EmptyState>;

  return (
    <ul className="space-y-3">
      {data.map((e) => {
        const details = e.details && typeof e.details === "object" && !Array.isArray(e.details) ? e.details : {};
        const handled = e.status === "closed";
        return (
          <li key={e.id} className={cn("rounded-lg border bg-white p-5", handled ? "border-taupe opacity-75" : "border-chilli/30")}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <p>
                <span className="font-semibold">{e.name}</span>
                <span className="text-ink-muted"> · {enquiryTypeLabel(e.enquiry_type)}</span>
                {e.order_number && <span className="text-ink-muted"> · Order {e.order_number}</span>}
              </p>
              <p className="text-sm text-ink-muted">{dateTime.format(new Date(e.created_at))}</p>
            </div>
            <p className="mb-2 text-sm text-ink-muted">
              {e.email}
              {e.phone && ` · +91 ${e.phone}`}
            </p>
            {Object.keys(details).length > 0 && (
              <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 rounded-md bg-paper/50 p-3 text-sm">
                {Object.entries(details).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="capitalize text-ink-muted">{k.replace("_", " ")}</dt>
                    <dd>{String(v)}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mb-4 whitespace-pre-line">{e.message}</p>
            <EnquiryActions
              id={e.id}
              handled={handled}
              name={e.name}
              email={e.email}
              phone={e.phone}
              typeLabel={enquiryTypeLabel(e.enquiry_type)}
            />
          </li>
        );
      })}
    </ul>
  );
}
