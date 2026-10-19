import Link from "next/link";
import { renderTokensText } from "@/lib/content";
import { settingBool, settingLinks, settingString, socialLinks, type SiteSettings } from "@/lib/settings";
import { Marquee } from "./marquee";
import { SocialLinks } from "./social-icons";

/**
 * Chilli-red strip above the header: centred message (separate several with " | "; each gets a
 * little heart), social icons on the left and utility links (mobile_menu_links) on the right.
 */
export function AnnouncementBar({ settings }: { settings: SiteSettings }) {
  const raw = renderTokensText(settingString(settings, "announcement_bar_text"), settings);
  const text = raw
    ? raw
        .split(/\s*\|\s*/)
        .filter(Boolean)
        .map((part) => `${part} ♡`)
        .join("   |   ")
    : "";
  const socials = socialLinks(settings);
  const links = settingLinks(settings, "mobile_menu_links");
  if (!settingBool(settings, "announcement_bar_enabled") || (!text && socials.length === 0)) {
    return null;
  }

  return (
    <div className="bg-chilli text-white">
      <div className="mx-auto grid h-8 max-w-[1440px] grid-cols-1 items-center gap-4 px-4 md:px-6 lg:grid-cols-[1fr_auto_1fr]">
        {/* Always render the side columns so the message stays centred. */}
        <div className="hidden lg:block">
          <SocialLinks links={socials} className="gap-1 text-white" iconClassName="size-3.5" />
        </div>
        <div className="min-w-0 text-center text-[0.6875rem] font-medium uppercase tracking-[0.14em]">
          {text && <Marquee text={text} />}
        </div>
        <ul className="hidden justify-end gap-6 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] underline-offset-4 hover:underline"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
