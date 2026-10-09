import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { captureFinomeClick, finomeSignup } from "@/lib/finome/next";

// Refreshes the Supabase session cookie on every request so server components
// always see a valid session. Auth gating happens in lib/auth.ts helpers.
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Finome promoter links land here with ?fnm=<click id>; a new account made
  // after one is reported so the promoter can earn on its first payment.
  const finomeClick = captureFinomeClick(request, response);
  if (user && finomeClick) finomeSignup(request, response, user, event, finomeClick);

  return response;
}

export const config = {
  matcher: [
    // Skip static assets, images, and the Sentry tunnel; run everywhere else.
    "/((?!monitoring|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"
  ]
};
