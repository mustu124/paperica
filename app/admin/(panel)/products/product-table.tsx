"use client";

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, inputCls, StatusBadge, Toggle } from "@/components/admin/ui";
import { useSave } from "@/components/admin/use-save";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import { bulkUpdateProducts } from "./actions";

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number | null;
  stock: number | null;
  mode: "buy" | "whatsapp";
  isActive: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  image: string | null;
};

export function ProductTable({ products }: { products: ProductListItem[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { run, pending } = useSave();
  // Optimistic active toggles: flip at once, revert if the save fails.
  const [activeOverride, setActiveOverride] = useState<Record<string, boolean>>({});
  const setActive = (id: string, value: boolean) => {
    setActiveOverride((o) => ({ ...o, [id]: value }));
    void run(() => bulkUpdateProducts([id], { is_active: value }), value ? "Product is live" : "Product hidden").then(
      (r) => !r.ok && setActiveOverride((o) => ({ ...o, [id]: !value })),
    );
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => `${p.name} ${p.sku ?? ""} ${p.slug}`.toLowerCase().includes(q)) : products;
  }, [products, query]);
  const allChecked = visible.length > 0 && visible.every((p) => selected.has(p.id));

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulk = (patch: Parameters<typeof bulkUpdateProducts>[1], label: string) =>
    run(() => bulkUpdateProducts([...selected], patch), label).then((r) => r.ok && setSelected(new Set()));

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or SKU"
          aria-label="Search products"
          className={cn(inputCls, "pl-9")}
        />
      </div>

      {selected.size > 0 && (
        <div className="sticky top-16 z-20 flex flex-wrap items-center gap-2 rounded-lg border border-chilli/30 bg-blush/70 p-3 text-sm lg:top-2" role="region" aria-label="Bulk actions">
          <span className="mr-2 w-full font-medium sm:w-auto">{selected.size} selected</span>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => bulk({ is_active: true }, "Activated")}>Activate</Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => bulk({ is_active: false }, "Deactivated")}>Deactivate</Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => bulk({ is_new: true }, "Marked as New")}>Mark New</Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => bulk({ is_new: false }, "Removed New")}>Unmark New</Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => bulk({ is_best_seller: true }, "Marked as Best Seller")}>Mark Best Seller</Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => bulk({ is_best_seller: false }, "Removed Best Seller")}>Unmark Best Seller</Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto min-h-11 text-ink-muted underline lg:min-h-0">
            Clear
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState>{products.length ? "No products match your search." : "No products yet — add your first one."}</EmptyState>
      ) : (
        <>
        {/* Phones: one card per product */}
        <ul className="space-y-3 md:hidden">
          {visible.map((p) => (
            <li key={p.id} className={cn("flex gap-3 rounded-lg border border-taupe bg-white p-3", selected.has(p.id) && "border-chilli/40 bg-blush/30")}>
              <label className="-m-1 flex size-11 shrink-0 items-center justify-center">
                <input type="checkbox" aria-label={`Select ${p.name}`} checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="size-5 accent-chilli" />
              </label>
              <Link href={`/admin/products/${p.id}`} className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded bg-blush">
                {p.image && <Image src={p.image} alt="" fill sizes="64px" className="object-cover" />}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/products/${p.id}`} className="block py-2.5 font-medium leading-snug">
                  {p.name}
                </Link>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {p.price == null ? "On enquiry" : formatINR(p.price)} · {p.mode === "buy" ? "Buy online" : "WhatsApp"}
                  {p.stock != null && <span className={p.stock === 0 ? "text-chilli" : undefined}> · {p.stock === 0 ? "Sold out" : `${p.stock} in stock`}</span>}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3">
                  {p.isNew && <StatusBadge status="active" label="New" />}
                  {p.isBestSeller && <StatusBadge status="processing" label="Best seller" />}
                  <Toggle checked={activeOverride[p.id] ?? p.isActive} onChange={(v) => setActive(p.id, v)} label="Active" />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-lg border border-taupe bg-white md:block">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-taupe bg-paper/40 text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="w-14 px-2 py-1">
                  <label className="flex size-11 cursor-pointer items-center justify-center">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allChecked}
                    onChange={() => setSelected(allChecked ? new Set() : new Set(visible.map((p) => p.id)))}
                    className="size-4 accent-chilli"
                  />
                  </label>
                </th>
                <th className="px-2 py-3 font-medium">Product</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-taupe/60">
              {visible.map((p) => (
                <tr key={p.id} className={cn("hover:bg-blush/20", selected.has(p.id) && "bg-blush/30")}>
                  <td className="px-2 py-1">
                    <label className="flex size-11 cursor-pointer items-center justify-center">
                      <input type="checkbox" aria-label={`Select ${p.name}`} checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="size-4 accent-chilli" />
                    </label>
                  </td>
                  <td className="px-2 py-3">
                    <Link href={`/admin/products/${p.id}`} className="group flex items-center gap-3">
                      <span className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded bg-blush">
                        {p.image && <Image src={p.image} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                      <span>
                        <span className="font-medium group-hover:text-chilli group-hover:underline">{p.name}</span>
                        <span className="mt-0.5 flex flex-wrap gap-1">
                          {p.isNew && <StatusBadge status="active" label="New" />}
                          {p.isBestSeller && <StatusBadge status="processing" label="Best seller" />}
                          {p.sku && <span className="text-xs text-ink-muted">SKU {p.sku}</span>}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{p.price == null ? "On enquiry" : formatINR(p.price)}</td>
                  <td className={cn("px-4 py-3 text-right", p.stock === 0 && "font-medium text-chilli")}>
                    {p.stock == null ? "—" : p.stock === 0 ? "Sold out" : p.stock}
                  </td>
                  <td className="px-4 py-3">{p.mode === "buy" ? "Buy online" : "WhatsApp"}</td>
                  <td className="px-4 py-3">
                    <Toggle
                      checked={activeOverride[p.id] ?? p.isActive}
                      onChange={(v) => setActive(p.id, v)}
                      label={<span className="sr-only">Active</span>}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
