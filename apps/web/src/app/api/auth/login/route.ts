import { config } from '@/lib/config';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log(
      '[OAuth] Calling backend for OAuth URL:',
      `${config.backendBaseUrl}/auth/oauth/url`,
    );

    // Call backend to get OAuth URL
    const response = await fetch(`${config.backendBaseUrl}/auth/oauth/url`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[OAuth] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OAuth] Backend error response:', errorText);
      throw new Error(
        `Failed to get OAuth URL from backend: ${response.status} - ${errorText}`,
      );
    }

    const data = await response.json();
    console.log('[OAuth] Backend response data:', data);

    // Handle backend response format: { statusCode, data: { url } }
    const oauthUrl = data.data?.url || data.url;

    if (!oauthUrl) {
      console.error('[OAuth] Missing URL in backend response:', data);
      throw new Error('Backend response missing OAuth URL');
    }

    console.log('[OAuth] Redirecting to OAuth URL:', oauthUrl);

    // Server-side redirect to OAuth provider
    return Response.redirect(oauthUrl, 302);
  } catch (error) {
    console.error('OAuth initialization error:', error);

    // Redirect to error page if OAuth initialization fails
    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.set('error', 'oauth_init_failed');

    return Response.redirect(errorUrl, 302);
  }
}
