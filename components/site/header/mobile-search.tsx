"use client";

import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useModalDialog } from "@/components/ui/use-modal-dialog";

/** Search icon that opens a full-width search sheet sliding down from the top. */
export function MobileSearch() {
  const [open, setOpen] = useState(false);
  const { ref, onBackdropClick } = useModalDialog(open, () => setOpen(false));
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const id = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        aria-haspopup="dialog"
        className="flex size-11 items-center justify-center hover:text-chilli"
      >
        <Search className="size-5" aria-hidden />
      </button>

      <dialog
        ref={ref}
        aria-label="Search"
        onClick={onBackdropClick}
        className="pp-dialog pp-sheet fixed inset-x-0 top-0 m-0 w-full max-w-none bg-white p-0 text-ink"
      >
        <form
          role="search"
          action="/search"
          className="flex items-center gap-2 px-4 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            const q = inputRef.current?.value.trim();
            if (!q) return;
            setOpen(false);
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <label htmlFor={id} className="sr-only">
            Search products
          </label>
          <input
            ref={inputRef}
            id={id}
            name="q"
            type="search"
            autoFocus
            autoComplete="off"
            placeholder="Search notebooks, planners, gifts…"
            className="h-12 min-w-0 flex-1 border border-ink/20 px-3 text-base focus:border-chilli focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex size-11 shrink-0 items-center justify-center bg-blush hover:bg-chilli hover:text-white"
          >
            <Search className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close search"
            className="flex size-11 items-center justify-center hover:text-chilli"
          >
            <X className="size-5" aria-hidden />
          </button>
        </form>
      </dialog>
    </>
  );
}
