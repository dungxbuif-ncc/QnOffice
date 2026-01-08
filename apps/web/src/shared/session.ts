import { SessionOptions } from 'iron-session';
import { config } from './config';

export const sessionOptions: SessionOptions = {
  password: config.sessionSecret,
  cookieName: 'qn-session',
  cookieOptions: {
    httpOnly: true,
    secure: config.isProduction,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: 'lax',
  },
};
