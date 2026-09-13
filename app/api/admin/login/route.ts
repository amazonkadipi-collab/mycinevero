import { NextResponse } from "next/server";
import { COOKIE_NAME, createAdminSession } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const { username, password } = await request.json().catch(() => ({}));
  const expectedUser = process.env.ADMIN_DASHBOARD_USER;
  const expectedPassword = process.env.ADMIN_DASHBOARD_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return NextResponse.json({ error: "Admin authentication is not configured" }, { status: 503 });
  }

  if (username !== expectedUser || password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: createAdminSession(expectedUser),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return response;
}
