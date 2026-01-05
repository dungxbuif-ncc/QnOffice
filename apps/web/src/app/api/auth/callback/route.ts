import { config } from '@/lib/config';
import { SessionData, sessionOptions } from '@/lib/session';
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
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions,
    );

    // Exchange authorization code for tokens directly with backend
    const exchangeUrl = `${config.backendBaseUrl}/auth/exchange`;

    console.log(
      '[Callback] Exchanging code with backend:',
      exchangeUrl,
      'Code:',
      code.substring(0, 20) + '...',
    );

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

    const tokenData = await exchangeResponse.json();
    console.log({ tokenData });

    // Handle backend response format: { statusCode, data: { user, tokens } }
    const responseData = tokenData.data || tokenData;
    const accessToken =
      responseData.tokens?.access_token || tokenData.access_token;
    const refreshToken =
      responseData.tokens?.refresh_token || tokenData.refresh_token;
    const expiresIn = responseData.tokens?.expires_in || tokenData.expires_in;
    const user = responseData.user || tokenData.user;

    // Store tokens in session
    if (accessToken && user) {
      session.accessToken = accessToken;
      session.refreshToken = refreshToken;
      session.expiresAt = Date.now() + (expiresIn || 3600) * 1000;

      // Store user info - map from backend format to session format
      session.user = {
        id: user.id,
        username: user.name || user.username || user.email,
        firstName: user.name?.split(' ')[0],
        lastName: user.name?.split(' ').slice(1).join(' '),
        email: user.email,
      };

      await session.save();
      console.log('[Callback] Session saved successfully');

      // Redirect to dashboard on successful authentication
      return Response.redirect(new URL('/dashboard', request.url));
    } else {
      console.error('[Callback] Missing access token or user in response:', {
        hasAccessToken: !!accessToken,
        hasUser: !!user,
        tokenData,
      });
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
