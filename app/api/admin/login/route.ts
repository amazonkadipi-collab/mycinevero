import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME?.trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const COOKIE_NAME = 'elovex_admin';
const COOKIE_VALUE = 'authenticated';

function isConfigured() {
  return Boolean(ADMIN_USERNAME && ADMIN_PASSWORD);
}

function isAuthenticated(request: NextRequest) {
  return request.cookies.get(COOKIE_NAME)?.value === COOKIE_VALUE;
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAuthenticated(request) });
}

export async function POST(request: NextRequest) {
  if (!isConfigured()) return NextResponse.json({ error: 'Admin credentials are not configured.' }, { status: 503 });
  try {
    const body = await request.json();
    const username = String(body.username ?? '');
    const password = String(body.password ?? '');
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, COOKIE_VALUE, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
  return response;
}
