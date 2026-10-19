/**
 * The site's public origin, without a trailing slash. Server-side only (reads Vercel's
 * system variables). Uses NEXT_PUBLIC_SITE_URL when it holds a valid URL; otherwise the
 * Vercel deployment's own address; otherwise localhost. Never throws, so an empty or
 * mistyped variable can't break the build.
 */
export function siteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL, // e.g. paperica.in or paperica.vercel.app (no scheme)
    process.env.VERCEL_URL,
  ];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      return new URL(value.includes("://") ? value : `https://${value}`).origin;
    } catch {
      // not a URL: try the next candidate
    }
  }
  return "http://localhost:3000";
}
