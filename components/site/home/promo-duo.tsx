import { ButtonLink } from "@/components/ui/button";
import { renderTokensText } from "@/lib/content";
import type { HomepageSection } from "@/lib/data/homepage";
import type { SiteSettings } from "@/lib/settings";
import { RotatingImage } from "./rotating-image";
import { groupSlots } from "./slots";

/** Two large banners with serif overlay text and a pink button; images alternate A/B. */
export function PromoDuo({
  section,
  settings,
  intervalMs,
}: {
  section: HomepageSection;
  settings: SiteSettings;
  intervalMs: number;
}) {
  const tiles = groupSlots(section.assets).slice(0, 2);
  if (tiles.length === 0) return null;

  return (
    <section className="reveal mx-auto grid w-full max-w-[1440px] gap-4 px-4 pb-12 md:grid-cols-2 md:px-6 md:pb-16">
      {tiles.map((tile, i) => {
        const p = tile.primary;
        return (
          <div key={tile.slot} className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-blush md:aspect-[9/10]">
            <RotatingImage
              images={tile.images}
              intervalMs={intervalMs}
              offsetMs={intervalMs + i * Math.round(intervalMs / 2)}
              sizes="(min-width: 768px) 50vw, 100vw"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center bg-gradient-to-t from-ink/55 via-ink/20 to-transparent px-6 pt-24 text-center text-white">
              {p.heading && (
                <h2 className="font-serif text-3xl font-semibold drop-shadow md:text-4xl">
                  {renderTokensText(p.heading, settings)}
                </h2>
              )}
              {p.subheading && (
                <p className="mt-1 max-w-sm text-sm drop-shadow">{renderTokensText(p.subheading, settings)}</p>
              )}
              {p.button_label && p.link_url ? (
                <ButtonLink href={p.link_url} variant="tag" className="mb-5 mt-4">
                  {p.button_label}
                </ButtonLink>
              ) : (
                <div className="h-6" />
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
