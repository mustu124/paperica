import Image from "next/image";
import { Carousel } from "@/components/ui/carousel";
import { renderTokensText } from "@/lib/content";
import type { HomepageSection } from "@/lib/data/homepage";
import { ArtImage } from "@/components/ui/art-image";
import { BUNDLED_ROUND_LOGO, settingString, type SiteSettings } from "@/lib/settings";
import { configString, groupSlots } from "./slots";

/**
 * Round avatar, "Join the community on Instagram @handle", optional follower text, then a
 * carousel of portrait tiles linking to Instagram posts (admin-uploaded; no Instagram API).
 */
export function InstagramFeed({ section, settings }: { section: HomepageSection; settings: SiteSettings }) {
  const tiles = groupSlots(section.assets).filter((t) => t.images[0]);
  if (tiles.length === 0) return null;

  const heading = renderTokensText(configString(section.config, "heading"), settings);
  const handle = configString(section.config, "handle");
  const followers = renderTokensText(configString(section.config, "follower_text"), settings);
  const profileUrl = settingString(settings, "social_instagram");
  // The round footer logo suits the circular avatar better than the wide header logo.
  const avatar = configString(section.config, "avatar_url") || settingString(settings, "footer_illustration_url") || BUNDLED_ROUND_LOGO;
  const brand = settingString(settings, "brand_name");

  const handleEl = handle ? (
    profileUrl ? (
      <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-chilli hover:underline">
        {handle}
      </a>
    ) : (
      handle
    )
  ) : null;

  return (
    <section className="reveal mx-auto w-full max-w-[1440px] px-4 pb-14 md:px-6 md:pb-20">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        {avatar && (
          <div className="relative size-16 overflow-hidden rounded-full border-2 border-blush bg-white md:size-20">
            <Image src={avatar} alt={brand ? `${brand} logo` : ""} fill sizes="80px" className="object-contain p-1.5" />
          </div>
        )}
        {(heading || handleEl) && (
          <p className="font-serif text-2xl font-bold text-chilli md:text-3xl">
            {heading} {handleEl}
          </p>
        )}
        {followers && <p className="text-xs text-ink-muted">{followers}</p>}
      </div>

      <Carousel label="Instagram posts" slideClassName="basis-1/2 md:basis-1/4">
        {tiles.map((t) => {
          const img = (
            <ArtImage
              src={t.images[0].url}
              mobileSrc={t.images[0].mobileUrl}
              alt={t.images[0].alt}
              sizes="(min-width: 768px) 25vw, 50vw"
              mobileSizes="50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          );
          return t.primary.link_url ? (
            <a
              key={t.slot}
              href={t.primary.link_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t.images[0].alt || "Instagram post"} (opens Instagram in a new tab)`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-blush"
            >
              {img}
            </a>
          ) : (
            <div key={t.slot} className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-blush">
              {img}
            </div>
          );
        })}
      </Carousel>
    </section>
  );
}
