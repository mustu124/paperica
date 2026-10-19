"use client";

import { Grid2x2, Grid3x3 } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// Per-viewer preference for large (3-up) or compact (4-up) tiles, kept in localStorage.
type Density = "comfortable" | "compact";
const KEY = "paperica-grid-density";
const listeners = new Set<() => void>();

function read(): Density {
  try {
    return window.localStorage.getItem(KEY) === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}

function write(d: Density) {
  try {
    window.localStorage.setItem(KEY, d);
  } catch {
    // Storage blocked: the toggle still works until the next navigation.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function useDensity() {
  return useSyncExternalStore(subscribe, read, () => "comfortable" as Density);
}

export function DensityToggle() {
  const density = useDensity();
  const compact = density === "compact";
  return (
    <button
      type="button"
      onClick={() => write(compact ? "comfortable" : "compact")}
      aria-pressed={compact}
      aria-label={compact ? "Show larger product tiles" : "Show more products per row"}
      className="hidden size-11 items-center justify-center hover:text-chilli md:flex"
    >
      {compact ? <Grid2x2 className="size-5" aria-hidden /> : <Grid3x3 className="size-5" aria-hidden />}
    </button>
  );
}

/** Product grid: 2 columns on mobile/tablet; 3 (large tiles) or 4 (compact) on desktop. */
export function DensityGrid({ children }: { children: ReactNode }) {
  const density = useDensity();
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-5",
        density === "compact" ? "lg:grid-cols-4" : "lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10",
      )}
    >
      {children}
    </ul>
  );
}
