import { SessionData, sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getIronSession<SessionData>(
    request,
    NextResponse.next(),
    sessionOptions,
  );

  return NextResponse.json({
    isAuthenticated: !!session.accessToken,
    user: session.user || null,
  });
}
