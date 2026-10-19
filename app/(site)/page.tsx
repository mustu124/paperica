import type { Metadata } from "next";
import { CollectionCarousel } from "@/components/site/home/collection-carousel";
import { Hero } from "@/components/site/home/hero";
import { InstagramFeed } from "@/components/site/home/instagram-feed";
import { ProductMosaic } from "@/components/site/home/product-mosaic";
import { PromoDuo } from "@/components/site/home/promo-duo";
import { PromoTrio } from "@/components/site/home/promo-trio";
import { getHomepageSections, type HomepageSection } from "@/lib/data/homepage";
import { getMenu } from "@/lib/data/menu";
import { getLatestProducts, getProductCardsBySlugs } from "@/lib/data/products";
import { getSiteSettings } from "@/lib/data/settings";
import { settingNumber, settingString, type SiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const brand = settingString(settings, "brand_name");
  const tagline = settingString(settings, "tagline");
  return {
    title: { absolute: [brand, tagline].filter(Boolean).join(" — ") || "Home" },
    description: settingString(settings, "footer_about_blurb") || undefined,
  };
}

async function mosaicProducts(section: HomepageSection) {
  const slugs = Array.isArray(section.config.product_slugs)
    ? section.config.product_slugs.filter((s): s is string => typeof s === "string")
    : [];
  return slugs.length > 0 ? getProductCardsBySlugs(slugs) : getLatestProducts(8);
}

async function Section({
  section,
  settings,
  menu,
  intervalMs,
}: {
  section: HomepageSection;
  settings: SiteSettings;
  menu: Awaited<ReturnType<typeof getMenu>>;
  intervalMs: number;
}) {
  switch (section.type) {
    case "hero":
      return <Hero section={section} settings={settings} intervalMs={intervalMs} />;
    case "collection_carousel":
      return <CollectionCarousel section={section} menu={menu} />;
    case "promo_duo":
      return <PromoDuo section={section} settings={settings} intervalMs={intervalMs} />;
    case "product_mosaic":
      return <ProductMosaic section={section} settings={settings} products={await mosaicProducts(section)} />;
    case "promo_trio":
      return <PromoTrio section={section} settings={settings} />;
    case "instagram_feed":
      return <InstagramFeed section={section} settings={settings} />;
    default:
      // info_strip renders in the footer.
      return null;
  }
}

export default async function HomePage() {
  const [settings, sections, menu] = await Promise.all([getSiteSettings(), getHomepageSections(), getMenu()]);
  const intervalMs = settingNumber(settings, "hero_rotation_ms") ?? 1000;
  const brand = settingString(settings, "brand_name");
  const tagline = settingString(settings, "tagline");

  return (
    <>
      <h1 className="sr-only">{[brand, tagline].filter(Boolean).join(" — ")}</h1>
      {sections.map((section) => (
        <Section key={section.id} section={section} settings={settings} menu={menu} intervalMs={intervalMs} />
      ))}
    </>
  );
}
