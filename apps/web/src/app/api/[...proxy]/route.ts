import { config } from '@/lib/config';
import { SessionData, isSessionExpired, sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';

// API endpoints that don't require authentication or should be handled locally
const PUBLIC_ENDPOINTS = ['auth/refresh', 'auth/login'];
const LOCAL_ENDPOINTS = ['auth/logout']; // Endpoints handled locally, not forwarded

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
  const apiPath = pathSegments.slice(1).join('/'); // Remove 'api' from path

  try {
    // Check if this endpoint should be handled locally (not forwarded)
    const isLocalEndpoint = LOCAL_ENDPOINTS.some((endpoint) =>
      apiPath.includes(endpoint),
    );

    if (isLocalEndpoint) {
      // Return 404 to let Next.js handle the request with dedicated route
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    // Get session
    const session = await getIronSession<SessionData>(
      request,
      NextResponse.next(),
      sessionOptions,
    );

    // Check if endpoint requires authentication
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) =>
      apiPath.includes(endpoint),
    );

    if (!isPublicEndpoint) {
      // Check if user is authenticated
      if (!session.accessToken || isSessionExpired(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Forward request to backend
    const backendUrl = `${config.backendBaseUrl}${apiPath ? '/' + apiPath : ''}${url.search}`;
    console.log('[Proxy] Forwarding request:', {
      original: url.pathname,
      apiPath,
      backendUrl,
      method: request.method,
    });
    const headers = new Headers();

    // Copy original headers
    request.headers.forEach((value, key) => {
      if (key !== 'host' && key !== 'content-length') {
        headers.set(key, value);
      }
    });

    // Add Authorization header if user is authenticated
    if (session.accessToken) {
      headers.set('Authorization', `Bearer ${session.accessToken}`);
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

    // Copy response headers
    response.headers.forEach((value, key) => {
      nextResponse.headers.set(key, value);
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
