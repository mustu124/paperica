"use client";

import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import type { ListingParams } from "@/lib/collections";
import { cn } from "@/lib/cn";

export type SubChip = { slug: string; name: string };

/**
 * "Filter" button + left drawer: price range, availability, product type and subcategory chips.
 * The form is a plain GET form (works without JavaScript); with JS it navigates client-side.
 */
export function FilterDrawer({
  params,
  chips,
  activeCount,
  priceBounds,
  clearHref,
}: {
  params: ListingParams;
  chips: SubChip[];
  activeCount: number;
  priceBounds: { min: number; max: number } | null;
  clearHref: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const fieldset = "border-b border-taupe pb-6";
  const legend = "mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.2em]";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex h-11 items-center gap-2 rounded-full border border-ink/25 bg-white px-5 text-sm hover:border-chilli hover:text-chilli"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Filter
        {activeCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-chilli text-[0.625rem] text-white">
            {activeCount}
          </span>
        )}
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title="Filter" side="left" className="max-w-none bg-white sm:max-w-md">
        <form
          action={pathname}
          method="get"
          className="flex min-h-full flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const qs = new URLSearchParams();
            for (const [k, v] of data) if (typeof v === "string" && v.trim() !== "") qs.append(k, v.trim());
            setOpen(false);
            router.push(qs.size ? `${pathname}?${qs}` : pathname, { scroll: false });
          }}
        >
          {params.q && <input type="hidden" name="q" value={params.q} />}
          {params.sort !== "featured" && <input type="hidden" name="sort" value={params.sort} />}

          <fieldset className={fieldset}>
            <legend className={legend}>Price (₹)</legend>
            <div className="flex items-center gap-3">
              <label className="flex-1 text-xs text-ink-muted">
                Min
                <input
                  name="min"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  defaultValue={params.min ?? ""}
                  placeholder={priceBounds ? String(Math.floor(priceBounds.min)) : "0"}
                  className="mt-1 h-11 w-full border border-ink/30 px-3 text-base text-ink focus:border-chilli focus:outline-none"
                />
              </label>
              <span aria-hidden className="mt-5">–</span>
              <label className="flex-1 text-xs text-ink-muted">
                Max
                <input
                  name="max"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  defaultValue={params.max ?? ""}
                  placeholder={priceBounds ? String(Math.ceil(priceBounds.max)) : ""}
                  className="mt-1 h-11 w-full border border-ink/30 px-3 text-base text-ink focus:border-chilli focus:outline-none"
                />
              </label>
            </div>
          </fieldset>

          <fieldset className={fieldset}>
            <legend className={legend}>Availability</legend>
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="in_stock"
                value="1"
                defaultChecked={params.inStock}
                className="size-4 accent-chilli"
              />
              In stock only
            </label>
          </fieldset>

          <fieldset className={fieldset}>
            <legend className={legend}>Product type</legend>
            <div className="text-sm">
              {(
                [
                  ["", "All products"],
                  ["buy", "Ready to ship"],
                  ["whatsapp", "Customisable"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex min-h-11 items-center gap-3">
                  <input
                    type="radio"
                    name="type"
                    value={value}
                    defaultChecked={(params.type ?? "") === value}
                    className="size-4 accent-chilli"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {chips.length > 0 && (
            <fieldset className={fieldset}>
              <legend className={legend}>Category</legend>
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <label key={chip.slug} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name="sub"
                      value={chip.slug}
                      defaultChecked={params.subs.includes(chip.slug)}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-full border border-ink/30 px-3.5 text-xs transition-colors lg:min-h-0 lg:py-1.5",
                        "peer-checked:border-chilli peer-checked:bg-chilli peer-checked:text-white",
                        "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-chilli",
                        "hover:border-chilli",
                      )}
                    >
                      {chip.name}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-auto flex gap-3 pt-2">
            <Link
              href={clearHref}
              scroll={false}
              onClick={() => setOpen(false)}
              className={buttonClasses({ variant: "secondary", className: "flex-1" })}
            >
              Clear
            </Link>
            <Button type="submit" className="flex-1">
              Apply
            </Button>
          </div>
        </form>
      </Drawer>
    </>
  );
}
