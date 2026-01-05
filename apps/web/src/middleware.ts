import { PathUtils } from '@/constants/paths';
import {
  SessionData,
  isSessionExpired,
  middlewareSessionOptions,
} from '@/lib/session';
import { getIronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PathUtils.isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (PathUtils.isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(
      request,
      response,
      middlewareSessionOptions,
    );

    if (!session.accessToken || isSessionExpired(session)) {
      console.log('[Middleware] No valid session, redirecting to login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    console.log('[Middleware] Valid session found, allowing access');
    return response;
  } catch (error) {
    console.error('Middleware auth check failed:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|gif|svg|ico|css|js)$).*)',
  ],
};
