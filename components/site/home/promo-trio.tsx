import Image from "next/image";
import { Fragment } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Carousel } from "@/components/ui/carousel";
import { StickerBadge } from "@/components/ui/sticker-badge";
import { renderTokensText } from "@/lib/content";
import type { HomepageSection } from "@/lib/data/homepage";
import type { SiteSettings } from "@/lib/settings";
import { groupSlots } from "./slots";

/** Three square tiles, each with a round red sticker and a small pink "SHOP …" button. */
export function PromoTrio({ section, settings }: { section: HomepageSection; settings: SiteSettings }) {
  const tiles = groupSlots(section.assets).slice(0, 3);
  if (tiles.length === 0) return null;

  return (
    <section className="reveal mx-auto w-full max-w-[1440px] px-4 pb-12 md:px-6 md:pb-16">
      <Carousel
        label="Promotions"
        arrows={false}
        slideClassName="basis-[85%] sm:basis-1/2 md:basis-1/3"
      >
        {tiles.map((tile, i) => {
          const p = tile.primary;
          const sticker = p.badge_text ? renderTokensText(p.badge_text, settings).split("\n") : [];
          return (
            <div key={tile.slot} className="relative aspect-square overflow-hidden rounded-3xl bg-blush">
              {tile.images[0] && (
                <Image
                  src={tile.images[0].url}
                  alt={tile.images[0].alt}
                  fill
                  sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 85vw"
                  className="object-cover"
                />
              )}
              {sticker.length > 0 && (
                <StickerBadge
                  size="md"
                  tilt={i % 2 ? 8 : -10}
                  className="absolute left-4 top-1/3 -translate-y-1/2 md:left-6"
                >
                  {sticker.map((line, j) => (
                    <Fragment key={j}>
                      {j > 0 && <br />}
                      {line}
                    </Fragment>
                  ))}
                </StickerBadge>
              )}
              {p.button_label && p.link_url && (
                <div className="absolute inset-x-0 bottom-5 flex justify-center">
                  <ButtonLink href={p.link_url} variant="tag">
                    {p.button_label}
                  </ButtonLink>
                </div>
              )}
            </div>
          );
        })}
      </Carousel>
    </section>
  );
}
