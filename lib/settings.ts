// Typed accessors for site_settings values (safe on server and client).
// Values are never hard-coded here: a missing key returns an empty/neutral value.

export type SiteSettings = Record<string, unknown>;

export type NavLink = { label: string; href: string };

/** Logo files bundled with the site, used until Admin → Site Settings → Branding has one. */
export const BUNDLED_LOGO = "/brand/paperica-logo-horizontal.png";
export const BUNDLED_ROUND_LOGO = "/brand/paperica-logo-trim.png";

export type FooterConfig = {
  about_heading?: string;
  about_link_label?: string;
  about_link_href?: string;
  columns?: { heading: string; links: NavLink[] }[];
  follow_heading?: string;
  bottom_links?: NavLink[];
};

export function settingString(settings: SiteSettings, key: string): string {
  const v = settings[key];
  return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
}

export function settingNumber(settings: SiteSettings, key: string): number | null {
  const v = settings[key];
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

export function settingBool(settings: SiteSettings, key: string): boolean {
  const v = settings[key];
  return v === true || v === "true";
}

function isLink(v: unknown): v is NavLink {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as NavLink).label === "string" &&
    typeof (v as NavLink).href === "string"
  );
}

export function settingLinks(settings: SiteSettings, key: string): NavLink[] {
  const v = settings[key];
  return Array.isArray(v) ? v.filter(isLink) : [];
}

export function settingFooter(settings: SiteSettings): FooterConfig {
  const v = settings.footer;
  if (typeof v !== "object" || v === null || Array.isArray(v)) return {};
  const f = v as FooterConfig;
  return {
    ...f,
    columns: Array.isArray(f.columns)
      ? f.columns
          .filter((c) => c && typeof c.heading === "string")
          .map((c) => ({ heading: c.heading, links: Array.isArray(c.links) ? c.links.filter(isLink) : [] }))
      : [],
    bottom_links: Array.isArray(f.bottom_links) ? f.bottom_links.filter(isLink) : [],
  };
}

export type SocialLink = { network: "instagram" | "facebook" | "pinterest"; href: string; label: string };

/** Social links that have a URL set, in display order. */
export function socialLinks(settings: SiteSettings): SocialLink[] {
  const all: SocialLink[] = [
    { network: "instagram", href: settingString(settings, "social_instagram"), label: "Instagram" },
    { network: "facebook", href: settingString(settings, "social_facebook"), label: "Facebook" },
    { network: "pinterest", href: settingString(settings, "social_pinterest"), label: "Pinterest" },
  ];
  return all.filter((s) => /^https?:\/\//.test(s.href));
}
