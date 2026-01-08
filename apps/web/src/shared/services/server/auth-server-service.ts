import { sessionOptions } from '@/shared/session';
import { AuthProfile } from '@qnoffice/shared';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

/**
 * Get the current session from server-side
 * Use this in server components to access user data
 */
export async function getServerSession(): Promise<AuthProfile> {
  const cookieStore = await cookies();
  return getIronSession<AuthProfile>(cookieStore, sessionOptions);
}

/**
 * Get the current user from server-side session
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session.user || null;
}
