import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware that protects /admin/* routes (except /admin/login).
 *
 * It checks for the presence of the `cfs_token` cookie.
 * - If the cookie is missing and the user is accessing a protected admin route,
 *   redirect them to /admin/login.
 * - If the cookie IS present and the user is on /admin/login,
 *   redirect them to /admin (they're already logged in).
 *
 * NOTE: This is a quick client-side gate. The real security check happens
 * on every API call via the backend AuthGuard.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('cfs_token')?.value;

  const isLoginPage = pathname === '/admin/login';
  const isAdminRoute = pathname.startsWith('/admin');

  // Not an admin route — let it through
  if (!isAdminRoute) {
    return NextResponse.next();
  }

  // Has token + on login page → redirect to dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // No token + on protected admin page → redirect to login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
