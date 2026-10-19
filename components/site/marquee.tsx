"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Single line of text that scrolls smoothly only when it doesn't fit (e.g. on phones).
 * Users who prefer reduced motion get a truncated line instead.
 */
export function Marquee({ text }: { text: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const measure = () => setOverflowing(!reduce.matches && i.scrollWidth > o.clientWidth + 1);
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    reduce.addEventListener("change", measure);
    return () => {
      ro.disconnect();
      reduce.removeEventListener("change", measure);
    };
  }, [text]);

  return (
    <div ref={outer} className="overflow-hidden whitespace-nowrap">
      <div className={cn("inline-flex", overflowing && "animate-[marquee_18s_linear_infinite]")}>
        <span ref={inner} className={cn("inline-block", overflowing ? "pr-16" : "truncate")}>
          {text}
        </span>
        {overflowing && (
          <span aria-hidden className="inline-block pr-16">
            {text}
          </span>
        )}
      </div>
    </div>
  );
}
