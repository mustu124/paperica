import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

/**
 * Service-role client. Bypasses RLS, so use it only in trusted server code
 * (payment verification, webhooks, guest order creation) and never import it
 * from a Client Component. The "server-only" import enforces that at build time.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      // Orders and payments must always be read fresh, never from Next's fetch cache.
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    },
  );
}
