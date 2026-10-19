import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

/**
 * Cookie-less anon client for public storefront reads (RLS: active/public rows only).
 * Because it never touches the request, it can be used inside `'use cache'` functions,
 * so catalogue and content queries are cached and prerendered.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      // Caching happens only in the surrounding tagged `'use cache'` functions. Keep the raw
      // HTTP requests out of Next's persistent fetch cache, which isn't tag-aware for these
      // calls and would otherwise serve stale rows even after updateTag()/a redeploy.
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    },
  );
}
