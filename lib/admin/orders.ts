import type { DispatchStatus, PaymentStatus } from "@/types/db";

export const PAYMENT_TABS: { value: PaymentStatus | "all"; label: string }[] = [
  { value: "paid", label: "Confirmed (paid)" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "all", label: "All" },
];

export const DISPATCH_OPTIONS: { value: DispatchStatus; label: string }[] = [
  { value: "processing", label: "Processing" },
  { value: "dispatched", label: "Dispatched" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export type OrderFilters = { q: string; payment: PaymentStatus | "all"; dispatch: DispatchStatus | "" };

type Raw = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseOrderFilters(raw: Raw): OrderFilters {
  const payment = one(raw.payment);
  const dispatch = one(raw.dispatch);
  return {
    q: one(raw.q).trim().slice(0, 60),
    payment: (PAYMENT_TABS.some((t) => t.value === payment) ? payment : "paid") as OrderFilters["payment"],
    dispatch: (DISPATCH_OPTIONS.some((d) => d.value === dispatch) ? dispatch : "") as OrderFilters["dispatch"],
  };
}

/** PostgREST `or` filter for the search box (order number, name or phone). */
export function orderSearchFilter(q: string) {
  const clean = q.replace(/[%_*,().\\:"']/g, " ").trim();
  if (!clean) return null;
  const digits = clean.replace(/\D/g, "");
  const parts = [`order_number.ilike."%${clean}%"`, `customer_name.ilike."%${clean}%"`];
  if (digits.length >= 3) parts.push(`customer_phone.ilike."%${digits}%"`);
  return parts.join(",");
}

