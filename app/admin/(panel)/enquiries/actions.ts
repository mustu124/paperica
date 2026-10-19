"use server";

import { friendlyError, NOT_AUTHORISED, requireAdmin, type ActionResult } from "@/lib/admin/auth";

/** "Mark as handled" toggle. */
export async function setEnquiryHandled(id: string, handled: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return NOT_AUTHORISED;
  const { error } = await admin.supabase.from("enquiries").update({ status: handled ? "closed" : "new" }).eq("id", id);
  return error ? { ok: false, error: friendlyError(error) } : { ok: true };
}
