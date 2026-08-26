import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isEdgeAdminTokenValid } from "./libs/adminAuthEdge";

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isAdminAuthenticated = isEdgeAdminTokenValid(adminCookie);

    // Handle /consol_admin routes
    if (pathname.startsWith("/consol_admin")) {
      // Subroutes of /consol_admin require active session, redirecting unauthenticated visitors to /consol_admin root
      if (pathname !== "/consol_admin" && !isAdminAuthenticated) {
        return NextResponse.redirect(new URL("/consol_admin", req.url));
      }

      return NextResponse.next();
    }

    // If an authenticated admin visits old /admin/* routes, route them to the new Console Admin
    if (pathname.startsWith("/admin") && isAdminAuthenticated) {
      if (pathname === "/admin/scan") {
        return NextResponse.redirect(new URL("/consol_admin/scan", req.url));
      }
      return NextResponse.redirect(new URL("/consol_admin", req.url));
    }

    const token = req.nextauth.token;
    if (!token && !pathname.startsWith("/auth/login"))
      return NextResponse.redirect(new URL("/auth/login", req.url));

    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (pathname.startsWith("/auth/login")) {
      if (token?.role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      if (token && token?.role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/auth/login", "/consol_admin/:path*"],
};
