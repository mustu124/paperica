import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type HeaderSource = { get(name: string): string | null };

/** Best-effort client IP (Vercel sets x-forwarded-for; the first entry is the client). */
export function clientIp(source: HeaderSource | { headers: HeaderSource }) {
  // Check for .get rather than `"headers" in source`: Next's ReadonlyHeaders answers `in` for any key.
  const headers = typeof (source as HeaderSource).get === "function" ? (source as HeaderSource) : (source as { headers: HeaderSource }).headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/**
 * Fixed-window limit per client IP, backed by Postgres (shared by all serverless instances).
 * Pass a Request (route handlers) or `await headers()` (server actions).
 * Returns true when the request is allowed. Fails open if the limiter itself errors,
 * so a database hiccup never blocks a paying customer.
 */
export async function rateLimit(
  source: HeaderSource | { headers: HeaderSource },
  bucket: string,
  max: number,
  windowSeconds: number,
) {
  try {
    const { data, error } = await createAdminClient().rpc("check_rate_limit", {
      p_key: `${bucket}:${clientIp(source)}`,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data !== false;
  } catch (e) {
    console.error("[rate-limit] check failed, allowing request:", (e as Error).message);
    return true;
  }
}
