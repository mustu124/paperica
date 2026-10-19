import Image from "next/image";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { renderTokensText } from "@/lib/content";
import { getHomepageSections } from "@/lib/data/homepage";
import { getSiteSettings } from "@/lib/data/settings";
import { TAGS } from "@/lib/data/tags";
import { BUNDLED_ROUND_LOGO, settingFooter, settingString, socialLinks, type NavLink, type SiteSettings } from "@/lib/settings";
import { SocialLinks } from "../social-icons";
import { InfoStrip } from "./info-strip";

function FooterLink({ link, settings }: { link: NavLink; settings: SiteSettings }) {
  const href = renderTokensText(link.href, settings);
  const label = renderTokensText(link.label, settings);
  if (!href) return null;
  // 44px rows on touch-size screens; compact list from 1024px.
  const cls = "flex min-h-11 items-center text-sm text-ink/80 hover:text-chilli hover:underline hover:underline-offset-4 lg:inline lg:min-h-0";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={cls}>
        {label}
      </Link>
    );
  }
  const external = /^https?:\/\//.test(href);
  return (
    <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {label}
    </a>
  );
}

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 font-serif text-xl font-bold text-chilli">{children}</h2>;
}

/** Info strip + cream footer columns + bottom row. Everything comes from settings/homepage tables. */
export async function SiteFooter() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.settings, TAGS.homepage);

  const [settings, strips] = await Promise.all([getSiteSettings(), getHomepageSections("info_strip")]);
  const footer = settingFooter(settings);
  const brand = settingString(settings, "brand_name");
  const blurb = renderTokensText(settingString(settings, "footer_about_blurb"), settings);
  // Setting key kept from when this slot held the chilli illustration.
  const logo = settingString(settings, "footer_illustration_url") || BUNDLED_ROUND_LOGO;
  const socials = socialLinks(settings);

  return (
    <footer className="mt-auto bg-cream">
      <InfoStrip section={strips[0]} settings={settings} />

      <div className="bg-blush/60">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 md:px-6 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_minmax(0,1fr)] lg:gap-8 lg:py-14">
          {/* About */}
          <div className="max-w-sm">
            {footer.about_heading && <ColumnHeading>{footer.about_heading}</ColumnHeading>}
            {blurb && <p className="text-sm leading-relaxed text-ink/80">{blurb}</p>}
            {footer.about_link_href && footer.about_link_label && (
              <Link
                href={footer.about_link_href}
                className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-chilli underline-offset-4 hover:underline lg:mt-3 lg:min-h-0"
              >
                {footer.about_link_label}
              </Link>
            )}
          </div>

          {/* Link columns: accordions below 1024px, columns above */}
          <div className="-mx-4 border-y border-taupe md:-mx-6 lg:hidden">
            {footer.columns?.map((col) => (
              <details key={col.heading} name="footer-columns" className="group border-b border-taupe px-4 last:border-b-0 md:px-6">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between font-serif text-xl font-bold text-chilli [&::-webkit-details-marker]:hidden">
                  {col.heading}
                  <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <ul className="pb-3">
                  {col.links.map((link, i) => (
                    <li key={i}>
                      <FooterLink link={link} settings={settings} />
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
          <div className="hidden gap-8 lg:col-span-3 lg:grid lg:grid-cols-3">
            {footer.columns?.map((col) => (
              <nav key={col.heading} aria-label={col.heading}>
                <ColumnHeading>{col.heading}</ColumnHeading>
                <ul className="space-y-2.5">
                  {col.links.map((link, i) => (
                    <li key={i}>
                      <FooterLink link={link} settings={settings} />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* Logo + follow along (where the reference shows its mascot) */}
          <div className="flex flex-col items-start gap-4 lg:items-center">
            {logo && (
              <Link href="/" aria-label={`${brand || "Home"} home`} className="block">
                <Image src={logo} alt={brand} width={480} height={482} sizes="(min-width: 1024px) 128px, 96px" className="h-auto w-24 lg:w-32" />
              </Link>
            )}
            {socials.length > 0 && (
              <div className="lg:text-center">
                {footer.follow_heading && (
                  <p className="mb-2 font-serif text-base font-semibold">{footer.follow_heading}</p>
                )}
                <SocialLinks links={socials} className="-ml-1 gap-2 text-chilli lg:ml-0" iconClassName="size-5" />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-taupe">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-5 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:pr-24 md:pl-6 md:pr-28">
            <p>
              © {new Date().getFullYear()} {brand}
            </p>
            {footer.bottom_links && footer.bottom_links.length > 0 && (
              <ul className="flex flex-wrap gap-x-5">
                {footer.bottom_links.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <Link href={link.href} className="inline-flex min-h-11 items-center hover:text-chilli hover:underline lg:min-h-0">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
