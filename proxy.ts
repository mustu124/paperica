// Next.js 16 renamed `middleware.ts` to `proxy.ts`; this is the admin guard.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/db";

const LOGIN_PATH = "/admin/login";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // getUser() validates the token with Supabase Auth (and refreshes it if needed).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    // RLS lets a user read only their own admins row, so a hit means they're an admin.
    const { data } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = Boolean(data);
  }

  // The password-reset email link lands here before there is a session.
  if (request.nextUrl.pathname === "/admin/auth/callback") return response;

  const isLoginPage = request.nextUrl.pathname === LOGIN_PATH;

  if (isLoginPage) {
    if (isAdmin) return redirectWithCookies(request, response, "/admin");
    return response;
  }

  if (!isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    if (user) url.searchParams.set("error", "not_authorised");
    else url.searchParams.set("next", request.nextUrl.pathname);
    return redirectWithCookies(request, response, url);
  }

  return response;
}

/** Redirect while keeping any refreshed auth cookies set during this request. */
function redirectWithCookies(
  request: NextRequest,
  from: NextResponse,
  to: string | URL,
) {
  const redirect = NextResponse.redirect(
    typeof to === "string" ? new URL(to, request.url) : to,
  );
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/admin/:path*"],
};
