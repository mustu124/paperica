import Link from "next/link";
import { renderTokensText } from "@/lib/content";
import type { HomepageSection } from "@/lib/data/homepage";
import type { ProductCardData } from "@/lib/data/products";
import type { SiteSettings } from "@/lib/settings";
import { ArtImage } from "@/components/ui/art-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductCard, type TileTone } from "../product-card";
import { configString, type Asset } from "./slots";

const TONES: TileTone[] = ["blush", "paper", "tint-blue", "white"];

/** Optional heading ("The New Collection" + View all), then a lifestyle block beside a 4×2 product grid. */
export function ProductMosaic({
  section,
  products,
  settings,
}: {
  section: HomepageSection;
  products: ProductCardData[];
  settings: SiteSettings;
}) {
  const images: Asset[] = section.assets
    .filter((a) => a.slot === 0 && a.image_url)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 2);
  if (images.length === 0 && products.length === 0) return null;

  const caption = images[0]?.heading ? renderTokensText(images[0].heading, settings) : "";
  const link = images[0]?.link_url;
  const toneSetting = configString(section.config, "tile_tone") as TileTone;
  const tone = TONES.includes(toneSetting) ? toneSetting : "blush";

  const lifestyle = (
    // Laptops: the two photos fill the height beside the products (≈16:10 each). Phones and
    // tablets: each photo is 16:10 (a fixed height made thin strips on tablets).
    <div className="relative grid h-full gap-2 overflow-hidden rounded-3xl lg:min-h-[28rem] lg:grid-rows-2">
      {images.map((img) => (
        <div key={img.id} className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-blush lg:aspect-auto">
          <ArtImage
            src={img.image_url as string}
            mobileSrc={img.mobile_image_url}
            alt={img.image_alt}
            sizes="(min-width: 1024px) 40vw, 100vw"
            mobileSizes="100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>
      ))}
      {caption && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/60 to-transparent px-6 pb-6 pt-20">
          <p className="font-serif text-2xl font-semibold text-white drop-shadow md:text-3xl">{caption}</p>
        </div>
      )}
    </div>
  );

  const heading = configString(section.config, "heading");
  const viewAll = configString(section.config, "view_all_url");

  return (
    <section className="reveal bg-blush/70 py-10 md:py-14">
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6">
        {heading && <SectionHeading title={heading} align="start" viewAll={viewAll ? { href: viewAll } : null} />}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)]">
          {images.length > 0 &&
            (link ? (
              <Link href={link} className="group block">
                {lifestyle}
              </Link>
            ) : (
              lifestyle
            ))}
          {products.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {products.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <ProductCard
                    product={p}
                    tone={tone}
                    sizes="(min-width: 1440px) 220px, (min-width: 1024px) 15vw, (min-width: 768px) 25vw, 50vw"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
