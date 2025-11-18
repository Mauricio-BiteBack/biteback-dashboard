import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const session = req.cookies.get("sb-access-token"); // Token Supabase

  // Rutas privadas
  const protectedRoutes = [
    "/members",
    "/transactions",
    "/rewards",
    "/scan",
    "/analytics",
    "/"
  ];

  // Si intenta acceder a ruta privada sin sesión → redirect
  if (protectedRoutes.some((r) => url.pathname.startsWith(r))) {
    if (!session) {
      url.pathname = "/auth";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/members/:path*",
    "/transactions/:path*",
    "/rewards/:path*",
    "/scan/:path*",
    "/analytics/:path*",
    "/"
  ],
};