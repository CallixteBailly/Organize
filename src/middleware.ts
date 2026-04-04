import { auth } from "@/lib/auth";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/activate-account", "/api/auth", "/api/webhooks", "/api/siret", "/api/cron"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  if (isPublicRoute) return;

  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)"],
};
