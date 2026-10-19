"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { rateLimit } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter your email and password." };
  // Per visitor IP: Supabase's own sign-in limit sees every attempt as coming from the server.
  if (!(await rateLimit(await headers(), "admin-login", 10, 900))) {
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) return { error: "Incorrect email or password." };

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    return { error: "This account does not have admin access." };
  }

  // Only allow redirects back into the admin area.
  const next = parsed.data.next;
  redirect(next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

/**
 * Sends Supabase's standard password-reset email. The link returns to /admin/auth/callback,
 * then to the "set a new password" page. Always answers the same way, so it can't be used
 * to discover which emails are admins.
 */
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const message = "If that email belongs to an admin, a reset link is on its way. Check your inbox.";
  const parsed = z.email().safeParse(email.trim());
  if (!parsed.success) return { message: "Enter the email you sign in with." };
  if (!(await rateLimit(await headers(), "password-reset", 3, 900))) return { message };

  const site = siteUrl();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${site}/admin/auth/callback?next=/admin/account/password`,
  });
  return { message };
}

const passwordSchema = z
  .object({ password: z.string().min(10, "Use at least 10 characters."), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "The two passwords don't match.", path: ["confirm"] });

export async function updatePassword(input: { password: string; confirm: string }): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Your reset link has expired. Request a new one from the sign-in page." };
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const { error } = await admin.supabase.auth.updateUser({ password: parsed.data.password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
