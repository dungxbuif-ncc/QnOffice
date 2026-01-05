import { PATHS } from '@/constants';
import { SessionData, clearSession, sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions,
    );

    clearSession(session);
    await session.save();

    return NextResponse.redirect(PATHS.AUTH.LOGIN);
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        statusCode: 500,
        message: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
