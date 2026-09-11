import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/p(\d+)\/?$/);
  if (!match) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/p/${match[1]}`;
  return NextResponse.rewrite(url);
}

export const config = { matcher: ['/p:page(\\d+)'] };

// Keeps the public URL short (/p2) while routing it to the dynamic page implementation.
