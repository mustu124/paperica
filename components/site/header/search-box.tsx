"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/cn";

type Suggestion = { name: string; href: string; price: number | null; customisable: boolean; image: string | null };

/**
 * Desktop search: magnifier button + soft pill field with live suggestions
 * (ARIA combobox). Submits to /search?q=.
 */
export function SearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapper = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data: { results: Suggestion[] } = await res.json();
        setResults(data.results);
        setActive(-1);
        setOpen(true);
      } catch {
        // Aborted or offline: keep the previous suggestions.
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close when clicking anywhere outside the search box.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const visible = open && query.trim().length >= 2;
  // Options: up to 5 products + "See all results".
  const optionCount = results.length + 1;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const allResultsHref = `/search?q=${encodeURIComponent(query.trim())}`;

  return (
    <form
      ref={wrapper}
      role="search"
      action="/search"
      className={cn("relative flex w-full max-w-sm items-center gap-3", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (visible && active >= 0) {
          go(active < results.length ? results[active].href : allResultsHref);
        } else if (query.trim()) {
          go(allResultsHref);
        }
      }}
    >
      <button
        type="submit"
        aria-label="Search"
        className="-ml-2 flex size-11 shrink-0 items-center justify-center text-ink transition-colors hover:text-chilli"
      >
        <Search className="size-6" strokeWidth={1.5} aria-hidden />
      </button>
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search products
      </label>
      <input
        id={`${listId}-input`}
        name="q"
        type="search"
        autoComplete="off"
        placeholder="Search for notebooks, planners and more…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value.trim().length < 2) setResults([]);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (!visible) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % optionCount);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a <= 0 ? optionCount - 1 : a - 1));
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={visible && active >= 0 ? `${listId}-${active}` : undefined}
        className="h-10 min-w-0 flex-1 rounded-full border border-white/70 bg-white/55 px-5 text-sm placeholder:text-ink-muted/80 focus:border-chilli/40 focus:bg-white focus:outline-none"
      />

      {visible && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-12 top-full z-50 mt-2 w-[22rem] overflow-hidden rounded-2xl border border-blush bg-white shadow-lg"
        >
          {results.length === 0 && (
            <li className="px-4 py-3 text-sm text-ink-muted">No products found</li>
          )}
          {results.map((r, i) => (
            <li
              key={r.href}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={active === i}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r.href)}
              className={cn(
                "flex cursor-pointer items-center gap-3 px-3 py-2",
                active === i && "bg-blush/50",
              )}
            >
              <div className="relative size-12 shrink-0 bg-blush">
                {r.image && <Image src={r.image} alt="" fill sizes="48px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{r.name}</p>
                <p className="text-xs text-ink-muted">
                  {r.price == null ? "Enquire for price" : `${r.customisable ? "From " : ""}${formatINR(r.price)}`}
                </p>
              </div>
            </li>
          ))}
          <li
            id={`${listId}-${results.length}`}
            role="option"
            aria-selected={active === results.length}
            onMouseEnter={() => setActive(results.length)}
            onClick={() => go(allResultsHref)}
            className={cn(
              "cursor-pointer border-t border-taupe px-4 py-3 text-sm underline underline-offset-4",
              active === results.length && "bg-blush/50",
            )}
          >
            See all results for “{query.trim()}”
          </li>
        </ul>
      )}
    </form>
  );
}
