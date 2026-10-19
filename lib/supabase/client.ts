import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/db";

/** Supabase client for Client Components. Uses only the public anon key. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
