import { config } from '@/shared/config';
import { sessionOptions } from '@/shared/session';
import { ApiResponse, AuthProfile } from '@qnoffice/shared';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('[Callback] OAuth error:', error);
      return Response.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(error)}`, request.url),
      );
    }

    if (!code) {
      console.error('[Callback] Missing authorization code');
      return Response.redirect(
        new URL('/auth/login?error=missing_code', request.url),
      );
    }

    // Get session
    const cookieStore = await cookies();
    const session = await getIronSession<AuthProfile>(
      cookieStore,
      sessionOptions,
    );
    const exchangeUrl = `${config.backendBaseUrl}/auth/exchange`;
    const exchangeResponse = await fetch(exchangeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        state,
      }),
    });

    if (!exchangeResponse.ok) {
      console.error(
        '[Callback] Token exchange failed:',
        exchangeResponse.status,
      );
      const errorText = await exchangeResponse.text();
      console.error('[Callback] Token exchange error:', errorText);
      return Response.redirect(
        new URL('/auth/login?error=exchange_failed', request.url),
      );
    }

    const tokenData =
      (await exchangeResponse.json()) as ApiResponse<AuthProfile>;

    if (tokenData.data?.tokens || tokenData.data?.user) {
      session.user = tokenData.data.user;
      session.tokens = tokenData.data.tokens;
      await session.save();
      return Response.redirect(new URL('/dashboard', request.url));
    } else {
      return Response.redirect(
        new URL('/auth/login?error=no_token', request.url),
      );
    }
  } catch (error) {
    console.error('[Callback] OAuth callback error:', error);
    return Response.redirect(
      new URL('/auth/login?error=callback_error', request.url),
    );
  }
}
