"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Children, useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Horizontal Embla carousel with round arrow buttons and dots, as on the reference site.
 * Control how many slides show with `slideClassName` (flex-basis), e.g.
 * "basis-1/2 md:basis-1/4 lg:basis-1/6".
 */
export function Carousel({
  children,
  label,
  slideClassName = "basis-full",
  gapClassName = "-ml-4",
  slidePaddingClassName = "pl-4",
  loop = false,
  startIndex = 0,
  autoplayMs,
  arrows = true,
  arrowsInset = false,
  dots = true,
  dotsClassName,
  className,
}: {
  children: ReactNode;
  label: string;
  slideClassName?: string;
  gapClassName?: string;
  slidePaddingClassName?: string;
  loop?: boolean;
  /** Slide to show first (when not all slides fit). */
  startIndex?: number;
  autoplayMs?: number;
  arrows?: boolean;
  /** Arrows sit inside the slide edges (full-width banners) instead of overhanging. */
  arrowsInset?: boolean;
  dots?: boolean;
  dotsClassName?: string;
  className?: string;
}) {
  const [emblaRef, embla] = useEmblaCarousel(
    { loop, startIndex, align: "start", containScroll: "trimSnaps" },
    autoplayMs ? [Autoplay({ delay: autoplayMs, stopOnInteraction: true, stopOnMouseEnter: true })] : [],
  );
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    if (!embla) return;
    setSnaps(embla.scrollSnapList());
    setSelected(embla.selectedScrollSnap());
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    // Defer the first sync so we don't set state synchronously inside the effect.
    const raf = requestAnimationFrame(sync);
    embla.on("select", sync).on("reInit", sync);
    return () => {
      cancelAnimationFrame(raf);
      embla.off("select", sync).off("reInit", sync);
    };
  }, [embla, sync]);

  const slides = Children.toArray(children);
  const arrowBtn =
    "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-md transition hover:bg-chilli hover:text-white disabled:opacity-0 md:flex";

  return (
    <section aria-roledescription="carousel" aria-label={label} className={cn("relative", className)}>
      <div ref={emblaRef} className="overflow-hidden">
        <div className={cn("flex touch-pan-y", gapClassName)}>
          {slides.map((child, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
              className={cn("min-w-0 shrink-0 grow-0", slideClassName, slidePaddingClassName)}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {arrows && (
        <>
          <button
            type="button"
            className={cn(arrowBtn, arrowsInset ? "left-3 lg:left-5" : "-left-3 lg:-left-5")}
            onClick={() => embla?.scrollPrev()}
            disabled={!canPrev}
            aria-label="Previous slides"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={cn(arrowBtn, arrowsInset ? "right-3 lg:right-5" : "-right-3 lg:-right-5")}
            onClick={() => embla?.scrollNext()}
            disabled={!canNext}
            aria-label="Next slides"
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </>
      )}

      {dots && snaps.length > 1 && (
        <div className={cn("mt-2 flex justify-center lg:mt-4 lg:gap-1", dotsClassName)}>
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => embla?.scrollTo(i)}
              aria-label={`Go to slide group ${i + 1}`}
              aria-current={i === selected ? "true" : undefined}
              className="group grid size-11 place-items-center lg:size-6"
            >
              <span
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  i === selected ? "bg-ink" : "bg-taupe group-hover:bg-ink-muted",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
