import { config } from '@/shared/config';
import { PATHS } from '@/shared/constants/paths';
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OAuth] Backend error response:', errorText);
      throw new Error(
        `Failed to get OAuth URL from backend: ${response.status} - ${errorText}`,
      );
    }

    const data = await response.json();

    // Handle backend response format: { statusCode, data: { url } }
    const oauthUrl = data.data?.url || data.url;

    if (!oauthUrl) {
      console.error('[OAuth] Missing URL in backend response:', data);
      throw new Error('Backend response missing OAuth URL');
    }

    console.log('[OAuth] Returning OAuth URL to client:', oauthUrl);

    // Return URL to client for client-side redirect
    return Response.json({ url: oauthUrl });
  } catch (error) {
    console.error('OAuth initialization error:', error);

    // Redirect to error page if OAuth initialization fails
    const errorUrl = new URL(PATHS.AUTH.ERROR, config.frontendBaseUrl);
    errorUrl.searchParams.set('error', 'oauth_init_failed');

    return Response.redirect(errorUrl, 302);
  }
}
