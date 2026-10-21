"use client";

import { useEffect, useRef, useState } from "react";

/** Scroll speed in pixels per second. */
const SPEED = 40;

/**
 * Single line of text that scrolls continuously from right to left. The text is repeated
 * enough times to fill the strip, so there is never a gap. Users who prefer reduced motion
 * get a still, centred (truncated) line instead.
 */
export function Marquee({ text }: { text: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  // Copies per half of the track (0 = not measured yet or reduced motion: show the still line).
  const [copies, setCopies] = useState(0);
  const [duration, setDuration] = useState(20);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const measure = () => {
      const width = i.offsetWidth;
      if (reduce.matches || width === 0) return setCopies(0);
      const n = Math.max(1, Math.ceil(o.clientWidth / width));
      setCopies(n);
      setDuration((n * width) / SPEED);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    reduce.addEventListener("change", measure);
    return () => {
      ro.disconnect();
      reduce.removeEventListener("change", measure);
    };
  }, [text]);

  return (
    <div ref={outer} className="relative overflow-hidden whitespace-nowrap">
      {/* Hidden measuring copy (one item with its spacing). */}
      <span ref={inner} aria-hidden className="invisible absolute left-0 top-0 inline-block pr-16">
        {text}
      </span>
      {copies === 0 ? (
        <span className="block truncate">{text}</span>
      ) : (
        <>
          <span className="sr-only">{text}</span>
          <div aria-hidden className="inline-flex w-max animate-[marquee_linear_infinite]" style={{ animationDuration: `${duration}s` }}>
            {Array.from({ length: copies * 2 }, (_, k) => (
              <span key={k} className="inline-block pr-16">
                {text}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
