// proxy.ts
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
]);

const STATIC_PREFIXES = [
  "/_next",
  "/favicon.ico",
  "/images",
  "/public",
  "/api",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

function isStaticLike(pathname: string) {
  return STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function normalizeNextTarget(raw: string | null) {
  const fallback = "/welcome";

  if (!raw) return fallback;

  let value = raw.trim();
  if (!value) return fallback;

  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }

  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value === "/login" || value.startsWith("/login?")) return fallback;

  return value;
}

function hasAnyPossibleSessionCookie(req: NextRequest) {
  const possibleNames = [
    process.env.NEXT_PUBLIC_WEB_AUTH_COOKIE_NAME || "",
    "ntg_session",
    "nt_session",
    "web_session",
    "web_auth",
    "auth_token",
    "session",
    "token",
    "nt_access_token",
  ].filter(Boolean);

  for (const name of possibleNames) {
    const v = req.cookies.get(name)?.value?.trim();
    if (v) return true;
  }

  return false;
}

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (isStaticLike(pathname)) {
    return NextResponse.next();
  }

  // Keep proxy lightweight and non-destructive:
  // - do NOT force protected routes back to /login
  // - only redirect away from /login if a likely session cookie exists
  // Real auth validation is done by frontend via /web/auth/me
  if (pathname === "/login") {
    const hasCookie = hasAnyPossibleSessionCookie(req);

    if (hasCookie) {
      const nextParam = req.nextUrl.searchParams.get("next");
      const target = normalizeNextTarget(nextParam);
      return NextResponse.redirect(new URL(target, req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$).*)",
  ],
};