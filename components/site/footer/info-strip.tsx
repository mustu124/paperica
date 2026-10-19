import Image from "next/image";
import { CircleHelp, Gift, Heart, MessageCircle, Package, Sparkles, Truck, type LucideIcon } from "lucide-react";
import { renderTokensText } from "@/lib/content";
import type { HomepageSection } from "@/lib/data/homepage";
import type { SiteSettings } from "@/lib/settings";
import { DoodleDashes } from "@/components/ui/doodles";
import { InlineLinks } from "../inline-links";

// Icon names an admin can choose for each column (section config: { "icons": [...] }).
const ICONS: Record<string, LucideIcon> = {
  truck: Truck,
  package: Package,
  help: CircleHelp,
  gift: Gift,
  heart: Heart,
  sparkles: Sparkles,
  chat: MessageCircle,
};

/**
 * Rounded blush band above the footer: three columns, each with an outlined icon, a tiny label
 * and an uppercase headline (+ optional line with links). Content: homepage_sections "info_strip".
 * Asset fields: badge_text = label, heading = headline, subheading = text, image_url = custom icon.
 */
export function InfoStrip({ section, settings }: { section: HomepageSection | undefined; settings: SiteSettings }) {
  if (!section || section.assets.length === 0) return null;
  const icons = Array.isArray(section.config.icons) ? section.config.icons : [];

  return (
    <section aria-label="Shopping information" className="relative mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6 md:py-10">
      <DoodleDashes className="absolute left-2 top-3 hidden size-9 -rotate-45 text-chilli md:block" />
      <DoodleDashes className="absolute bottom-3 right-2 hidden size-9 rotate-[135deg] text-chilli md:block" />
      <ul className="grid gap-6 rounded-[2.5rem] bg-blush px-6 py-7 sm:grid-cols-3 md:px-10 lg:py-8">
        {section.assets.map((a) => {
          const iconName = icons[a.slot];
          const Icon = typeof iconName === "string" ? ICONS[iconName] : undefined;
          return (
            <li key={a.id} className="flex items-center gap-4 sm:justify-center">
              {a.image_url ? (
                <Image src={a.image_url} alt="" width={40} height={40} className="size-10 shrink-0 object-contain" />
              ) : Icon ? (
                <Icon className="size-9 shrink-0 text-chilli" strokeWidth={1.3} aria-hidden />
              ) : null}
              <div className="min-w-0">
                {a.badge_text && (
                  <p className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-chilli">
                    {renderTokensText(a.badge_text, settings)}
                  </p>
                )}
                {a.heading && (
                  <p className="text-[0.8125rem] font-semibold uppercase leading-snug tracking-[0.12em]">
                    {renderTokensText(a.heading, settings)}
                  </p>
                )}
                {a.subheading && (
                  <p className="mt-0.5 text-xs leading-snug text-ink/75">
                    <InlineLinks
                      text={renderTokensText(a.subheading, settings)}
                      linkClassName="underline underline-offset-2 hover:text-chilli"
                    />
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
