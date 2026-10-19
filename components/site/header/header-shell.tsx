"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Sticky wrapper for header + nav. Sets data-scrolled once the page scrolls past the top,
 * which children use (via group-data-[scrolled=true]) to shrink the logo and padding.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Expose the live header height (it shrinks on scroll) for sticky elements below it.
  useEffect(() => {
    const el = header.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden className="h-px" />
      <header
        ref={header}
        data-scrolled={scrolled}
        className={cn(
          "group sticky top-0 z-40 -mt-px bg-blush transition-shadow",
          scrolled && "shadow-[0_2px_14px_-6px_rgb(139_0_0/0.25)]",
        )}
      >
        {children}
      </header>
    </>
  );
}
