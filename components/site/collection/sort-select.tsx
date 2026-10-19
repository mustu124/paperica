"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORTS, type SortKey } from "@/lib/collections";

/** "Sort: Featured" dropdown. Updates ?sort= and resets pagination. */
export function SortSelect({ value }: { value: SortKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="relative flex items-center gap-1 text-sm">
      <span>Sort:</span>
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value === "featured") next.delete("sort");
          else next.set("sort", e.target.value);
          next.delete("page");
          const qs = next.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }}
        className="h-11 cursor-pointer appearance-none bg-transparent pl-1 pr-6 text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-chilli lg:text-sm"
      >
        {(Object.keys(SORTS) as SortKey[]).map((k) => (
          <option key={k} value={k}>
            {SORTS[k]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 size-4" aria-hidden />
    </label>
  );
}
