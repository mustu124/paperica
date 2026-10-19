import Image from "next/image";
import Link from "next/link";
import type { MenuCategory } from "@/lib/data/menu";
import { BUNDLED_LOGO, settingLinks, settingString, socialLinks, type SiteSettings } from "@/lib/settings";
import { CartButton } from "./cart-button";
import { HeaderShell } from "./header-shell";
import { MainNav } from "./mega-nav";
import { MobileMenu } from "./mobile-menu";
import { MobileSearch } from "./mobile-search";
import { SearchBox } from "./search-box";

function Logo({ settings }: { settings: SiteSettings }) {
  const brand = settingString(settings, "brand_name");
  const tagline = settingString(settings, "tagline");
  const logo = settingString(settings, "logo_url") || BUNDLED_LOGO;
  const alt = [brand, tagline].filter(Boolean).join(" — ") || "Home";

  return (
    <Link href="/" aria-label={`${brand || "Home"} home`} className="block">
      {logo ? (
        <Image
          src={logo}
          alt={alt}
          width={700}
          height={266}
          priority
          sizes="(min-width: 1024px) 240px, 140px"
          className="h-12 w-auto transition-[height] duration-300 group-data-[scrolled=true]:h-10 lg:h-[4.75rem] lg:group-data-[scrolled=true]:h-14"
        />
      ) : (
        <span className="font-display text-3xl text-chilli lg:text-4xl">{brand}</span>
      )}
    </Link>
  );
}

/** Pink three-zone header (search · logo · cart) with the nav underneath; sticky and shrinks on scroll. */
export function SiteHeader({ settings, menu }: { settings: SiteSettings; menu: MenuCategory[] }) {
  return (
    <HeaderShell>
      <div className="mx-auto grid max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-4 py-2 transition-[padding] duration-300 md:px-6 lg:pb-1 lg:pt-4 lg:group-data-[scrolled=true]:pt-1.5">
        <div className="flex items-center">
          <div className="flex items-center lg:hidden">
            <MobileMenu
              menu={menu}
              footerLinks={settingLinks(settings, "mobile_menu_links")}
              socials={socialLinks(settings)}
            />
            <MobileSearch />
          </div>
          <SearchBox className="hidden lg:flex" />
        </div>

        <Logo settings={settings} />

        <div className="flex items-center justify-end">
          <CartButton />
        </div>
      </div>
      <MainNav menu={menu} />
    </HeaderShell>
  );
}
