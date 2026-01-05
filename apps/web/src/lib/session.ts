import { SessionOptions } from 'iron-session';
import { config } from './config';

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  user?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export const defaultSession: SessionData = {};

export const sessionOptions: SessionOptions = {
  password: config.sessionSecret,
  cookieName: 'qn-session',
  cookieOptions: {
    httpOnly: true,
    secure: config.isProduction,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
  },
};

// Edge-compatible session options for middleware
export const middlewareSessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    'NvwDtVe757q/Q8Aafy0nGrlyu6zDDYV0idgKcs7r1ak=',
  cookieName: 'qn-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
  },
};

export function isSessionExpired(session: SessionData): boolean {
  if (!session.expiresAt) return true;
  return Date.now() > session.expiresAt;
}

export function clearSession(session: SessionData): void {
  session.accessToken = undefined;
  session.refreshToken = undefined;
  session.expiresAt = undefined;
  session.user = undefined;
}
