import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

/**
 * Re-checks admin access inside every server action / route handler (server actions are
 * public endpoints, so the /admin proxy check alone isn't enough). Returns the user-session
 * Supabase client: all admin reads and writes go through RLS (`is_admin()`).
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return data ? { supabase, user } : null;
}

export const NOT_AUTHORISED: ActionResult<never> = {
  ok: false,
  error: "Your session has expired. Please sign in again.",
};

/** Turns common Postgres errors into messages a shop owner can act on. */
export function friendlyError(error: { message: string; code?: string } | null | undefined, fallback = "Couldn't save. Please try again.") {
  if (!error) return fallback;
  if (error.code === "23505") return "That name or URL is already used by another item. Please choose a different one.";
  if (error.message.includes("personalised category must use WhatsApp mode"))
    return "Products in PERSONALISED must use “Customise on WhatsApp”. Remove the PERSONALISED categories first, or keep WhatsApp mode.";
  if (error.message.includes("products_price_required_for_buy"))
    return "Products sold online need a price. Only “Customise on WhatsApp” products can leave the price empty.";
  if (error.message.includes("mobile_image_url"))
    return "Phone images need a database update first: run supabase/migrations/20261019000700_mobile_images.sql in the Supabase SQL editor.";
  if (error.code === "42501") return "You don't have permission to do that. Please sign in again.";
  console.error("[admin]", error.code, error.message);
  return fallback;
}
