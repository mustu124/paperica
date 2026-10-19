import type { Metadata } from "next";
import { AnnouncementBar } from "@/components/site/announcement-bar";
import { CartDrawer } from "@/components/site/cart-drawer";
import { CartProvider } from "@/components/site/cart-provider";
import { FloatingWhatsApp } from "@/components/site/floating-whatsapp";
import { SiteFooter } from "@/components/site/footer/site-footer";
import { SiteHeader } from "@/components/site/header/site-header";
import { renderTokensText } from "@/lib/content";
import { getMenu } from "@/lib/data/menu";
import { getSiteSettings } from "@/lib/data/settings";
import { openGraphDefaults } from "@/lib/seo";
import { settingString } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    openGraph: { type: "website", ...openGraphDefaults(settings) },
    twitter: { card: "summary_large_image" },
  };
}

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [settings, menu] = await Promise.all([getSiteSettings(), getMenu()]);
  // Empty-cart button points at the first menu head (NEW IN).
  const firstHead = menu[0];

  return (
    <CartProvider>
      <a
        href="#main"
        className="sr-only z-50 bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:left-2 focus:top-2"
      >
        Skip to content
      </a>
      <AnnouncementBar settings={settings} />
      <SiteHeader settings={settings} menu={menu} />
      <main id="main" className="flex flex-1 flex-col bg-cream">
        {children}
      </main>
      <SiteFooter />
      <FloatingWhatsApp settings={settings} />
      <CartDrawer
        cartMessage={renderTokensText(settingString(settings, "cart_message"), settings)}
        emptyCta={firstHead ? { label: firstHead.name, href: firstHead.href } : null}
      />
    </CartProvider>
  );
}
