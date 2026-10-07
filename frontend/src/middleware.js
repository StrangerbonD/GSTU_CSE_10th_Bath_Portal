import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const authSession = request.cookies.get("auth_session")?.value;
  const userRole = request.cookies.get("user_role")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const authUserMin = request.cookies.get("auth_user_min")?.value;

  const isAuthenticated = Boolean(authSession || refreshToken || authUserMin);

  // 1. Protect Admin routes
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole && userRole !== "Admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 2. Protect Student Dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Redirect authenticated users away from /login and /register
  if (pathname === "/login" || pathname === "/register") {
    // সেশন এক্সপায়ার হয়ে রিডাইরেক্ট আসলে কখনো ড্যাশবোর্ডে পুশ করবে না
    if (request.nextUrl.searchParams.get("reason") === "session_expired") {
      return NextResponse.next();
    }
    if (isAuthenticated) {
      const destination = userRole === "Admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/login", "/register"],
};
