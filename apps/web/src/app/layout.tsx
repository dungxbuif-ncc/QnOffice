import { AuthProvider } from '@/contexts/auth-context';
import { SessionData, isSessionExpired, sessionOptions } from '@/lib/session';
import ReactQueryProvider from '@/providers/query-provider';
import { getIronSession } from 'iron-session';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'QN Office Management',
  description: 'Office management system for QN',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get session data server-side
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions,
  );

  const initialAuthState: {
    user: any;
    isAuthenticated: boolean;
  } = {
    user: null,
    isAuthenticated: false,
  };

  // Check if user has valid session
  if (session.accessToken && !isSessionExpired(session) && session.user) {
    initialAuthState.user = session.user;
    initialAuthState.isAuthenticated = true;
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReactQueryProvider>
          <AuthProvider initialState={initialAuthState}>
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
