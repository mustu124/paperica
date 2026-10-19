"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useModalDialog } from "@/components/ui/use-modal-dialog";
import { cn } from "@/lib/cn";

type Img = { url: string; alt: string };

/** Swipeable track shared by the mobile gallery and the lightbox. */
function useTrack(startIndex: number) {
  const [ref, embla] = useEmblaCarousel({ loop: false, startIndex });
  const [index, setIndex] = useState(startIndex);
  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);
  return { ref, embla, index };
}

function Dots({ count, index, onSelect, light }: { count: number; index: number; onSelect: (i: number) => void; light?: boolean }) {
  if (count < 2) return null;
  return (
    <div className="flex justify-center lg:gap-1">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Show image ${i + 1}`}
          aria-current={i === index ? "true" : undefined}
          className="grid size-11 place-items-center lg:size-6"
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              i === index ? (light ? "bg-white" : "bg-ink") : light ? "bg-white/40" : "bg-taupe",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function Lightbox({ images, open, start, onClose }: { images: Img[]; open: boolean; start: number; onClose: () => void }) {
  const { ref, onBackdropClick } = useModalDialog(open, onClose);
  return (
    <dialog
      ref={ref}
      aria-label="Product images"
      onClick={onBackdropClick}
      className="pp-dialog pp-modal m-0 h-dvh max-h-none w-screen max-w-none bg-ink p-0 text-white"
    >
      {open && <LightboxTrack images={images} start={start} onClose={onClose} />}
    </dialog>
  );
}

function LightboxTrack({ images, start, onClose }: { images: Img[]; start: number; onClose: () => void }) {
  const { ref, embla, index } = useTrack(start);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") embla?.scrollNext();
      if (e.key === "ArrowLeft") embla?.scrollPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [embla]);

  const arrow =
    "absolute top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-0 md:flex";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <span aria-live="polite">
          {index + 1} / {images.length}
        </span>
        <button type="button" onClick={onClose} aria-label="Close" className="p-2 hover:text-blush" autoFocus>
          <X className="size-6" aria-hidden />
        </button>
      </div>
      <div ref={ref} className="relative flex-1 overflow-hidden">
        <div className="flex h-full touch-pan-y">
          {images.map((img, i) => (
            <div key={img.url + i} className="relative h-full min-w-0 shrink-0 grow-0 basis-full">
              <Image src={img.url} alt={img.alt} fill sizes="100vw" className="object-contain" />
            </div>
          ))}
        </div>
        <button type="button" className={cn(arrow, "left-4")} onClick={() => embla?.scrollPrev()} disabled={index === 0} aria-label="Previous image">
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          className={cn(arrow, "right-4")}
          onClick={() => embla?.scrollNext()}
          disabled={index === images.length - 1}
          aria-label="Next image"
        >
          <ArrowRight className="size-5" aria-hidden />
        </button>
      </div>
      <div className="py-3">
        <Dots count={images.length} index={index} onSelect={(i) => embla?.scrollTo(i)} light />
      </div>
    </div>
  );
}

/**
 * Desktop: vertical thumbnail strip + large main image. Mobile: swipeable carousel with dots.
 * Clicking the image opens a full-screen lightbox (swipe / arrow keys).
 */
export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const { ref: mobileRef, embla: mobileEmbla, index: mobileIndex } = useTrack(0);
  const close = useCallback(() => setLightbox(null), []);
  const list = images.length > 0 ? images : [];

  if (list.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center bg-blush font-display text-2xl text-chilli/60">
        {name}
      </div>
    );
  }

  return (
    <>
      {/* Mobile carousel */}
      <div className="md:hidden">
        <div ref={mobileRef} className="-mx-4 overflow-hidden">
          <div className="flex touch-pan-y">
            {list.map((img, i) => (
              <button
                key={img.url + i}
                type="button"
                onClick={() => setLightbox(i)}
                aria-label={`Enlarge image ${i + 1} of ${list.length}`}
                className="relative aspect-[4/5] min-w-0 shrink-0 grow-0 basis-full bg-blush"
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  // Both layouts are in the DOM; "1px" when hidden makes the browser fetch a
                  // tiny variant instead of a second full-size image.
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  sizes="(min-width: 768px) 1px, 100vw"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2">
          <Dots count={list.length} index={mobileIndex} onSelect={(i) => mobileEmbla?.scrollTo(i)} />
        </div>
      </div>

      {/* Desktop: thumbnails + main image */}
      <div className="hidden gap-4 md:grid md:grid-cols-[4.5rem_minmax(0,1fr)] lg:grid-cols-[5.5rem_minmax(0,1fr)]">
        <ul className="flex max-h-[44rem] flex-col gap-3 overflow-y-auto" aria-label="Product images">
          {list.map((img, i) => (
            <li key={img.url + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${list.length}`}
                aria-current={i === active ? "true" : undefined}
                className={cn(
                  "relative block aspect-[4/5] w-full overflow-hidden bg-blush outline-offset-2",
                  i === active ? "ring-1 ring-ink" : "opacity-70 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="(max-width: 767px) 1px, 88px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setLightbox(active)}
          aria-label="Enlarge image"
          className="group relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-blush"
        >
          <Image
            src={list[active].url}
            alt={list[active].alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 767px) 1px, (min-width: 1440px) 720px, 50vw"
            className="object-cover"
          />
          <span className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <ZoomIn className="size-4" aria-hidden />
          </span>
        </button>
      </div>

      <Lightbox images={list} open={lightbox !== null} start={lightbox ?? 0} onClose={close} />
    </>
  );
}
