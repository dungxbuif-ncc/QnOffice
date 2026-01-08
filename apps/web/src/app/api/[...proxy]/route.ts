import { config } from '@/shared/config';
import { sessionOptions } from '@/shared/session';
import { AuthProfile } from '@qnoffice/shared';
import { getIronSession } from 'iron-session';
import { isEmpty } from 'lodash';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ENDPOINTS = ['auth/refresh', 'auth/login'];
const LOCAL_ENDPOINTS = ['auth/logout'];

export async function GET(request: NextRequest) {
  return handleApiRequest(request);
}

export async function POST(request: NextRequest) {
  return handleApiRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleApiRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleApiRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleApiRequest(request);
}

async function handleApiRequest(request: NextRequest) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const apiPath = pathSegments.slice(1).join('/');

  try {
    const isLocalEndpoint = LOCAL_ENDPOINTS.some((endpoint) =>
      apiPath.includes(endpoint),
    );

    if (isLocalEndpoint) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const session = await getIronSession<AuthProfile>(
      request,
      NextResponse.next(),
      sessionOptions,
    );

    const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) =>
      apiPath.includes(endpoint),
    );

    if (!isPublicEndpoint) {
      if (isEmpty(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const backendUrl = `${config.backendBaseUrl}${apiPath ? '/' + apiPath : ''}${url.search}`;
    console.log('[Proxy] Forwarding request:', {
      original: url.pathname,
      apiPath,
      backendUrl,
      method: request.method,
      tokens: session?.tokens?.accessToken,
    });
    const headers = new Headers();

    request.headers.forEach((value, key) => {
      if (key !== 'host' && key !== 'content-length') {
        headers.set(key, value);
      }
    });

    if (session?.tokens?.accessToken) {
      headers.set('Authorization', `Bearer ${session.tokens.accessToken}`);
    }

    // Forward request body if present
    let body: BodyInit | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.arrayBuffer();
    }

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
    });

    // Clone response to read data
    const responseData = await response.arrayBuffer();

    // Create response with original status and headers
    const nextResponse = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy response headers, excluding compression headers
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'content-encoding' && lowerKey !== 'transfer-encoding') {
        nextResponse.headers.set(key, value);
      }
    });

    return nextResponse;
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
