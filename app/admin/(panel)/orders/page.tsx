import { reconcileRecentPending } from "@/lib/checkout/reconcile";
import type { Metadata } from "next";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { Suspense } from "react";
import { PlaceholderNotice } from "@/components/admin/placeholder-notice";
import { EmptyState, inputCls, PageHeader, StatusBadge } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";
import { DISPATCH_OPTIONS, orderSearchFilter, PAYMENT_TABS, parseOrderFilters, type OrderFilters } from "@/lib/admin/orders";
import { cn } from "@/lib/cn";
import { formatDate, formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };
const PAGE_SIZE = 50;

type Props = PageProps<"/admin/orders">;

function qs(f: OrderFilters, extra: Record<string, string> = {}) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.payment !== "paid") p.set("payment", f.payment);
  if (f.dispatch) p.set("dispatch", f.dispatch);
  for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export default function OrdersPage({ searchParams }: Props) {
  return (
    <>
      <PageHeader title="Orders" description="Confirmed orders are paid. Pending and failed are unfinished checkouts — no money was taken for failed ones." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Orders({ searchParams }: Pick<Props, "searchParams">) {
  const raw = await searchParams;
  const f = parseOrderFilters(raw);
  const page = Math.max(1, Number(Array.isArray(raw.page) ? raw.page[0] : raw.page) || 1);
  const admin = await requireAdmin();
  if (!admin) return null;

  // Catch payments Razorpay took but the site never heard about (browser closed, webhook missing).
  await reconcileRecentPending();

  let query = admin.supabase
    .from("orders")
    .select("id, order_number, created_at, customer_name, customer_phone, total_inr, payment_status, dispatch_status")
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE); // one extra row tells us if there's a next page
  if (f.payment !== "all") query = query.eq("payment_status", f.payment);
  if (f.dispatch) query = query.eq("dispatch_status", f.dispatch);
  const search = orderSearchFilter(f.q);
  if (search) query = query.or(search);
  const { data, error } = await query;
  const orders = (data ?? []).slice(0, PAGE_SIZE);
  const hasNext = (data?.length ?? 0) > PAGE_SIZE;

  return (
    <div className="space-y-5">
      <PlaceholderNotice supabase={admin.supabase} />
      <nav aria-label="Payment status" className="flex flex-wrap gap-2">
        {PAYMENT_TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/orders${qs({ ...f, payment: t.value })}`}
            aria-current={f.payment === t.value ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-sm lg:min-h-0 lg:py-1.5",
              f.payment === t.value ? "border-chilli bg-chilli text-white" : "border-ink/20 bg-white hover:border-chilli",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <form className="flex flex-col gap-3 rounded-lg border border-taupe bg-white p-4 sm:flex-row sm:items-end">
        {f.payment !== "paid" && <input type="hidden" name="payment" value={f.payment} />}
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Search</span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input name="q" defaultValue={f.q} placeholder="Order number, name or phone" className={cn(inputCls, "pl-9")} />
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:w-48">
          <span className="font-medium">Dispatch status</span>
          <select name="dispatch" defaultValue={f.dispatch} className={inputCls}>
            <option value="">Any</option>
            {DISPATCH_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={buttonClasses({ size: "md" })}>
          Apply
        </button>
        <a href={`/admin/orders/export${qs(f)}`} className={buttonClasses({ variant: "secondary", size: "md" })}>
          <Download className="size-4" aria-hidden />
          CSV
        </a>
      </form>

      {error && <p className="text-chilli">Couldn&apos;t load orders: {error.message}</p>}
      {!error && orders.length === 0 ? (
        <EmptyState>No orders match these filters.</EmptyState>
      ) : (
        <>
        {/* Phones: one card per order */}
        <ul className="space-y-3 md:hidden">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.id}`} className="block rounded-lg border border-taupe bg-white p-4 active:bg-blush/30">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold text-chilli">{o.order_number}</span>
                  <span className="font-medium">{formatINR(o.total_inr)}</span>
                </span>
                <span className="mt-1 block text-sm">
                  {o.customer_name} · {o.customer_phone}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">{formatDate(o.created_at)}</span>
                <span className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={o.payment_status} />
                  <StatusBadge status={o.dispatch_status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-lg border border-taupe bg-white md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-taupe bg-paper/40 text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-taupe/60">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-blush/20">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-chilli underline-offset-4 hover:underline">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3">{o.customer_name}</td>
                  <td className="whitespace-nowrap px-4 py-3">{o.customer_phone}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatINR(o.total_inr)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.payment_status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.dispatch_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {(page > 1 || hasNext) && (
        <div className="flex justify-between">
          {page > 1 ? (
            <Link href={`/admin/orders${qs(f, { page: String(page - 1) })}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          {hasNext && (
            <Link href={`/admin/orders${qs(f, { page: String(page + 1) })}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
              Older →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
