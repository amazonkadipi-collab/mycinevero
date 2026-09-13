import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/adminAuth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  return response;
}
