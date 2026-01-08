import { PATHS } from '@/shared/constants';
import { sessionOptions } from '@/shared/session';
import { AuthProfile } from '@qnoffice/shared';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<AuthProfile>(
      cookieStore,
      sessionOptions,
    );
    await session.destroy();

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
