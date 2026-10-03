import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/checkout', '/orders', '/order-confirmation', '/admin'];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/checkout/:path*',
    '/orders/:path*',
    '/order-confirmation/:path*',
    '/admin/:path*',
  ],
};
