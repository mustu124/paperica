import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Carousel } from "@/components/ui/carousel";
import { SectionHeading } from "@/components/ui/section-heading";
import type { HomepageSection } from "@/lib/data/homepage";
import type { MenuCategory } from "@/lib/data/menu";
import { cn } from "@/lib/cn";
import { configString, groupSlots } from "./slots";

type Tile = { key: string; href: string; caption: string; line: string; image: string | null; alt: string };

// Pastel "blob" behind each tile, cycling like the mood board.
const TONES = ["bg-petal", "bg-butter", "bg-lilac", "bg-sage", "bg-peach", "bg-blush"];
// Slightly different organic shapes so the row feels hand-cut, not stamped.
const BLOBS = [
  "rounded-[46%_54%_42%_58%/52%_44%_56%_48%]",
  "rounded-[58%_42%_55%_45%/45%_56%_44%_55%]",
  "rounded-[42%_58%_47%_53%/57%_45%_55%_43%]",
  "rounded-[53%_47%_58%_42%/48%_57%_43%_52%]",
];

/**
 * "Shop by Collection": pastel blob tiles with a chilli caption, arrow and small line. Uses the
 * section's assets when present, otherwise falls back to the menu categories (their image_url).
 */
export function CollectionCarousel({
  section,
  menu,
}: {
  section: HomepageSection;
  menu: MenuCategory[];
}) {
  const fromAssets: Tile[] = groupSlots(section.assets)
    .filter((s) => s.primary.link_url)
    .map((s) => ({
      key: s.primary.id,
      href: s.primary.link_url as string,
      caption: s.primary.heading ?? "",
      line: s.primary.subheading ?? "",
      image: s.images[0]?.url ?? null,
      // The visible caption names the link, so the image is decorative unless the caption is empty.
      alt: s.primary.heading ? "" : (s.images[0]?.alt ?? ""),
    }));
  const tiles: Tile[] =
    fromAssets.length > 0
      ? fromAssets
      : menu.map((c) => ({ key: c.id, href: c.href, caption: c.name, line: "", image: c.image, alt: "" }));
  if (tiles.length === 0) return null;

  const heading = configString(section.config, "heading");
  const viewAll = configString(section.config, "view_all_url");

  return (
    <section className="reveal mx-auto w-full max-w-[1440px] px-4 py-10 md:px-6 md:py-14">
      {heading && <SectionHeading title={heading} align="start" viewAll={viewAll ? { href: viewAll } : null} />}
      <Carousel label={heading || "Collections"} slideClassName="basis-1/2 sm:basis-1/3 lg:basis-1/6">
        {tiles.map((t, i) => (
          <Link key={t.key} href={t.href} className="group block">
            <div className={cn("relative aspect-square overflow-hidden transition-transform duration-500 group-hover:-rotate-2", TONES[i % TONES.length], BLOBS[i % BLOBS.length])}>
              {t.image && (
                <Image
                  src={t.image}
                  alt={t.alt}
                  fill
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <p className="mt-3 flex items-center justify-between gap-2 px-1 font-serif text-xl font-bold leading-tight text-chilli md:text-[1.375rem]">
              {t.caption}
              <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
            </p>
            {t.line && (
              <p className="mt-1 px-1 text-[0.6875rem] uppercase leading-snug tracking-[0.14em] text-ink-muted">{t.line}</p>
            )}
          </Link>
        ))}
      </Carousel>
    </section>
  );
}
