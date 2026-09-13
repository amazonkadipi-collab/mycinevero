import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_WINDOW_MS = 5 * 60_000;
const MAX_FAILED_ATTEMPTS = 10;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const COOKIE_NAME = "cinevero_admin_session";
const authFailures = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(request: NextRequest) {
  const now = Date.now();
  const key = getClientKey(request);
  const current = authFailures.get(key);
  if (!current || current.resetAt <= now) return { limited: false, retryAfter: 0 };
  return { limited: current.count >= MAX_FAILED_ATTEMPTS, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}

function recordFailedAttempt(request: NextRequest) {
  const now = Date.now();
  const key = getClientKey(request);
  const current = authFailures.get(key);
  if (!current || current.resetAt <= now) {
    authFailures.set(key, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return;
  }
  current.count += 1;
}

async function verifySession(value: string | undefined, username: string, password: string) {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== username) return false;
  const issuedAt = Number(parts[1]);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > SESSION_TTL_MS || issuedAt > Date.now() + 60_000) return false;

  const payload = `${parts[0]}.${parts[1]}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
  return expected === parts[2];
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const username = process.env.ADMIN_DASHBOARD_USER;
  const password = process.env.ADMIN_DASHBOARD_PASSWORD;

  if (!username || !password) {
    return new NextResponse("Admin dashboard is not configured", { status: 503 });
  }

  // The branded login page and its login endpoint must remain public.
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const session = request.cookies.get(COOKIE_NAME)?.value;
  if (await verifySession(session, username, password)) {
    return NextResponse.next();
  }

  const rateLimit = isRateLimited(request);
  if (rateLimit.limited) {
    return new NextResponse("Too many authentication attempts. Please try again later.", {
      status: 429,
      headers: { "Retry-After": String(rateLimit.retryAfter) },
    });
  }

  recordFailedAttempt(request);

  if (pathname.startsWith("/api/admin/")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
