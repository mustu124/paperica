import { renderTokensText } from "@/lib/content";
import { settingBool, settingString, type SiteSettings } from "@/lib/settings";
import { Marquee } from "./marquee";

/**
 * Chilli-red strip above the header: the message scrolls across the full width in a continuous
 * loop (separate several messages with " | "; each gets a little heart).
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
  if (!settingBool(settings, "announcement_bar_enabled") || !text) return null;

  return (
    <div className="bg-chilli text-white">
      <div className="flex h-8 items-center text-[0.6875rem] font-medium uppercase tracking-[0.14em]">
        <div className="min-w-0 flex-1">
          <Marquee text={text} />
        </div>
      </div>
    </div>
  );
}
