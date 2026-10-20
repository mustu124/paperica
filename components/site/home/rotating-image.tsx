"use client";

import { ArtImage } from "@/components/ui/art-image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Img = { url: string; alt: string; mobileUrl?: string | null };

/**
 * Two stacked images that crossfade A ⇄ B every `intervalMs` (~400ms fade). Each may have a
 * separate phone version (shown below the md breakpoint).
 * `offsetMs` staggers neighbouring panels so they don't flip in unison.
 * Shows only image A when the user prefers reduced motion; pauses while the tab is hidden
 * or the image is off-screen.
 */
export function RotatingImage({
  images,
  intervalMs,
  offsetMs = 0,
  sizes,
  mobileSizes,
  priority = false,
  eager = false,
  className,
}: {
  images: Img[];
  intervalMs: number;
  offsetMs?: number;
  sizes: string;
  /** Sizes hint for the phone versions (when set). */
  mobileSizes?: string;
  /** Preload image A (use for the LCP image only). */
  priority?: boolean;
  /** Load without lazy-loading (above-the-fold images that aren't preloaded). */
  eager?: boolean;
  className?: string;
}) {
  const [showB, setShowB] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [a, b] = images;

  useEffect(() => {
    const el = ref.current;
    if (!b || !el || intervalMs <= 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;
    let onScreen = false;

    const stop = () => {
      clearTimeout(timeout);
      clearInterval(interval);
      timeout = interval = undefined;
    };
    const start = () => {
      if (timeout || interval || document.hidden || !onScreen) return;
      timeout = setTimeout(() => {
        setShowB((v) => !v);
        interval = setInterval(() => setShowB((v) => !v), intervalMs);
      }, offsetMs || intervalMs);
    };
    const sync = () => (document.hidden || !onScreen ? stop() : start());

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [b, intervalMs, offsetMs]);

  if (!a) return <div ref={ref} className={cn("absolute inset-0 bg-blush", className)} />;

  return (
    <div ref={ref} className={cn("absolute inset-0", className)}>
      <ArtImage
        src={a.url}
        mobileSrc={a.mobileUrl}
        alt={a.alt}
        sizes={sizes}
        mobileSizes={mobileSizes}
        priority={priority}
        loading={priority ? undefined : eager ? "eager" : "lazy"}
        className="object-cover"
      />
      {b && (
        <ArtImage
          src={b.url}
          mobileSrc={b.mobileUrl}
          alt={b.alt}
          sizes={sizes}
          mobileSizes={mobileSizes}
          // B must be ready by the first swap, but shouldn't compete with A for bandwidth.
          loading={priority || eager ? "eager" : "lazy"}
          fetchPriority="low"
          aria-hidden={!showB}
          className={cn(
            "object-cover transition-opacity duration-[400ms] ease-in-out",
            showB ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}
