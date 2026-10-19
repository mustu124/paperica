// With Cache Components, generateStaticParams must return at least one entry. A fresh or
// empty catalogue (or a build without database access) would otherwise fail the build, so
// fall back to a slug that matches nothing and renders the 404 page.
export const NO_MATCH_PARAM = "__none__";

export function withFallback<T>(params: T[], fallback: T): T[] {
  return params.length > 0 ? params : [fallback];
}
