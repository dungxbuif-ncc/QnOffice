import { config as appConfig } from '@/shared/config';
import { PATHS, PathUtils } from '@/shared/constants/paths';
import { sessionOptions } from '@/shared/session';
import { AuthProfile } from '@qnoffice/shared';
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
    const session = await getIronSession<AuthProfile>(
      request,
      response,
      sessionOptions,
    );

    if (!session.user || !session.tokens) {
      console.warn('[Middleware] No valid session, redirecting to login', {
        path: pathname,
        hasUser: !!session.user,
        hasTokens: !!session.tokens,
      });
      return NextResponse.redirect(
        new URL(PATHS.AUTH.LOGIN, appConfig.apiBaseUrl),
      );
    }

    if (!session?.user?.staffId && pathname !== PATHS.DASHBOARD.BASE) {
      return NextResponse.redirect(
        new URL(PATHS.DASHBOARD.BASE, appConfig.apiBaseUrl),
      );
    }

    return response;
  } catch (error) {
    console.error('Middleware auth check failed:', error);
    return NextResponse.redirect(
      new URL(PATHS.AUTH.LOGIN, appConfig.apiBaseUrl),
    );
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|gif|svg|ico|css|js)$).*)',
  ],
};
