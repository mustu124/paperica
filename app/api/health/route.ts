import { connection, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

// Names only (never values): lets an uptime check spot a deployment with missing settings.
const REQUIRED_ENV = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
] as const;

/**
 * Health check for uptime monitors: 200 when the app is up and Supabase answers within 5s,
 * 503 otherwise. Never cached; reveals no data or error details.
 */
export async function GET() {
  await connection(); // run on every request, never prerendered

  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  const started = Date.now();
  let database: "ok" | "unreachable" = "unreachable";
  if (!missing.includes("NEXT_PUBLIC_SUPABASE_URL") && !missing.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
    try {
      const { error } = await createPublicClient().from("site_settings").select("key").limit(1).abortSignal(AbortSignal.timeout(5000));
      if (!error) database = "ok";
    } catch {
      // timeout / network error → unreachable
    }
  }

  const ok = database === "ok" && missing.length === 0;
  return NextResponse.json(
    {
      status: ok ? "ok" : "error",
      database,
      databaseLatencyMs: Date.now() - started,
      config: missing.length ? { missing } : "ok",
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
      time: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
