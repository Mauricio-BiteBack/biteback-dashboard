import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function proxy(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = new URL(request.url);
  const pathname = url.pathname;

  // ✅ Permitir recursos estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // 🚫 Si no está logueado y entra a /members → redirigir a /auth
  if (!session && pathname.startsWith("/members")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // 🚪 Si está logueado y entra a /auth → redirigir a /members
  if (session && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/members", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*", "/members/:path*"],
};