import { settingString, type SiteSettings } from "@/lib/settings";

/** The default link-preview image (Admin → Site Settings → Link preview image). */
export function shareImages(settings: SiteSettings) {
  const url = settingString(settings, "og_image_url");
  return url ? [{ url, alt: settingString(settings, "brand_name") }] : [];
}

/**
 * Site-wide OpenGraph fields. A page that sets its own `openGraph` replaces the layout's whole
 * object (Next.js doesn't merge it), so such pages spread these in first.
 */
export function openGraphDefaults(settings: SiteSettings) {
  return {
    siteName: settingString(settings, "brand_name") || undefined,
    locale: "en_IN",
    images: shareImages(settings),
  };
}
