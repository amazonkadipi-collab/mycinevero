import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_WINDOW_MS = 5 * 60_000;
const MAX_FAILED_ATTEMPTS = 10;
const authFailures = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(request: NextRequest) {
  const now = Date.now();
  const key = getClientKey(request);
  const current = authFailures.get(key);

  if (!current || current.resetAt <= now) {
    return { limited: false, retryAfter: 0 };
  }

  return {
    limited: current.count >= MAX_FAILED_ATTEMPTS,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
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

export function middleware(request: NextRequest) {
  const username = process.env.ADMIN_DASHBOARD_USER;
  const password = process.env.ADMIN_DASHBOARD_PASSWORD;

  if (!username || !password) {
    return new NextResponse("Admin dashboard is not configured", { status: 503 });
  }

  const rateLimit = isRateLimited(request);
  if (rateLimit.limited) {
    return new NextResponse("Too many authentication attempts. Please try again later.", {
      status: 429,
      headers: { "Retry-After": String(rateLimit.retryAfter) },
    });
  }

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    try {
      const decoded = atob(authorization.slice(6));
      const separator = decoded.indexOf(":");
      const providedUser = separator >= 0 ? decoded.slice(0, separator) : "";
      const providedPassword = separator >= 0 ? decoded.slice(separator + 1) : "";

      if (providedUser === username && providedPassword === password) {
        return NextResponse.next();
      }
    } catch {
      // Fall through to the authentication challenge.
    }
  }

  recordFailedAttempt(request);

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Cinevero Admin", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
