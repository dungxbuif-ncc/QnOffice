import { SessionData, sessionOptions } from '@/shared/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

/**
 * Get the current session from server-side
 * Use this in server components to access user data
 */
export async function getServerSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  try {
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions,
    );
    return session;
  } catch (error) {
    console.error('[getServerSession] Failed to get session:', error);
    return {};
  }
}

/**
 * Get the current user from server-side session
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session.user || null;
}
