import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME?.trim() || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim();
const COOKIE_NAME = 'elovex_admin';

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: request.cookies.get(COOKIE_NAME)?.value === 'authenticated' });
}

export async function POST(request: NextRequest) {
  try {
    if (!ADMIN_PASSWORD) return NextResponse.json({ error: 'Admin authentication is not configured' }, { status: 503 });
    const body = await request.json();
    const username = String(body.username ?? '');
    const password = String(body.password ?? '');
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, 'authenticated', {
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
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
