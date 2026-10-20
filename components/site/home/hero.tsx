import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Fragment } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Carousel } from "@/components/ui/carousel";
import { DoodleStar } from "@/components/ui/doodles";
import { renderTokensText } from "@/lib/content";
import type { HomepageSection } from "@/lib/data/homepage";
import type { SiteSettings } from "@/lib/settings";
import { cn } from "@/lib/cn";
import { RotatingImage } from "./rotating-image";
import { configString, groupSlots } from "./slots";

const HEADING_FONT: Record<string, string> = {
  playful: "font-headline font-semibold text-4xl leading-[1.05] md:text-5xl lg:text-6xl",
  script: "font-script text-5xl leading-none md:text-7xl",
  serif: "font-serif font-bold text-4xl leading-tight md:text-6xl",
  display: "font-display text-4xl md:text-5xl",
};

/** "A little paper happiness for your *everyday life.*" → *…* parts in the handwritten script. */
function Headline({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) =>
    part.startsWith("*") && part.endsWith("*") ? (
      <span key={i} className="font-script text-[1.35em] font-normal leading-[0.8]">
        {part.slice(1, -1)}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/**
 * Full-width banner slider (arrows, swipe on phones). Each slide swaps between its image A and
 * image B every `intervalMs`. Text from a slide's image-A asset sits on the left: chilli headline
 * on light photos ("dark" text, default) or white over a shade ("light" text).
 */
export function Hero({
  section,
  settings,
  intervalMs,
}: {
  section: HomepageSection;
  settings: SiteSettings;
  intervalMs: number;
}) {
  const hasText = (p: ReturnType<typeof groupSlots>[number]["primary"]) =>
    Boolean(p.heading || p.subheading || (p.button_label && p.link_url));
  // Slides with neither an image nor text (e.g. left empty in the editor) are skipped.
  const panels = groupSlots(section.assets)
    .filter((p) => p.images.length > 0 || hasText(p.primary))
    .slice(0, 3);
  if (panels.length === 0) return null;
  const headingClass = HEADING_FONT[configString(section.config, "heading_font")] ?? HEADING_FONT.playful;
  const light = configString(section.config, "text_tone") === "light";
  // Start on the slide that carries the headline.
  const startIndex = Math.max(0, panels.findIndex((p) => hasText(p.primary)));

  return (
    <section aria-label="Featured" className="relative bg-blush">
      <Carousel
        label="Featured collections"
        loop={panels.length > 1}
        startIndex={startIndex}
        arrows={panels.length > 1}
        arrowsInset
        dots={panels.length > 1}
        slideClassName="basis-full"
        gapClassName=""
        slidePaddingClassName=""
        dotsClassName="absolute inset-x-0 bottom-6 z-10 mt-0 lg:hidden"
      >
        {panels.map((panel, i) => {
          const p = panel.primary;
          const heading = p.heading ? renderTokensText(p.heading, settings) : "";
          const line = p.subheading ? renderTokensText(p.subheading, settings) : "";

          return (
            <div
              key={panel.slot}
              className={cn(
                "relative overflow-hidden md:aspect-[16/7] lg:aspect-[12/5]",
                // A dedicated phone banner (e.g. 1080 × 1920) is shown in full on phones.
                panel.images[0]?.mobileUrl ? "aspect-[9/16]" : "aspect-[4/5] sm:aspect-[4/3]",
              )}
            >
              <RotatingImage
                images={panel.images}
                intervalMs={intervalMs}
                offsetMs={intervalMs}
                sizes="100vw"
                mobileSizes="100vw"
                priority={i === startIndex}
                eager={i === startIndex}
              />
              {/* Banner with its text and button drawn in: the whole slide is the link. */}
              {p.link_url && !p.button_label && (
                <Link href={p.link_url} aria-label={panel.images[0]?.alt || "Shop now"} className="absolute inset-0 z-[1]" />
              )}
              {hasText(p) && (
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 flex flex-col justify-end px-6 pb-14 sm:px-10 md:justify-center md:pb-0 lg:px-20",
                    light
                      ? "bg-gradient-to-t from-ink/60 via-ink/20 to-transparent text-white md:bg-gradient-to-r md:from-ink/50 md:via-ink/15"
                      : "bg-gradient-to-t from-blush via-blush/70 to-transparent text-ink md:bg-gradient-to-r md:from-blush/85 md:via-blush/40 md:to-transparent",
                  )}
                >
                  <div className="relative max-w-md lg:max-w-lg">
                    <DoodleStar className={cn("absolute -left-5 -top-6 size-7 -rotate-12 md:-left-9 md:-top-4 md:size-9", light ? "text-white" : "text-chilli")} />
                    {heading && (
                      <h2 className={cn(headingClass, "-rotate-2", light ? "text-white drop-shadow-[0_2px_8px_rgb(0_0_0/0.35)]" : "text-chilli")}>
                        <Headline text={heading} />
                      </h2>
                    )}
                    {line && (
                      <p className="mt-5 max-w-sm text-xs font-medium uppercase leading-relaxed tracking-[0.14em] md:text-[0.8125rem]">
                        {line}
                      </p>
                    )}
                    {p.button_label && p.link_url && (
                      <ButtonLink href={p.link_url} size="lg" className="pointer-events-auto mt-6">
                        {p.button_label}
                        <ArrowRight className="size-4" aria-hidden />
                      </ButtonLink>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Carousel>
      {/* Wavy paper edge into the cream page below. */}
      <svg viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden className="relative z-10 -mt-[22px] block h-6 w-full text-cream md:h-8">
        <path d="M0 22C120 8 240 8 360 18s240 22 360 12 240-28 360-22 240 22 360 14V40H0Z" fill="currentColor" />
      </svg>
    </section>
  );
}
