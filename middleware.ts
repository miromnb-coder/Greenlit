import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOCKED = ["/inbox", "/flow", "/playbook", "/import", "/connections", "/activity"];

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsAuth = LOCKED.some((p) => path === p || path.startsWith(`${p}/`));
  if (!user && needsAuth) {
    const to = new URL("/signin", request.url);
    to.searchParams.set("next", path);
    return NextResponse.redirect(to);
  }
  if (user && (path === "/signin" || path === "/signup")) {
    return NextResponse.redirect(new URL("/inbox", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/inbox/:path*", "/flow", "/playbook", "/import", "/connections", "/activity", "/signin", "/signup"],
};
