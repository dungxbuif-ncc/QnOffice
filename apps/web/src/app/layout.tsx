import { AuthProvider } from '@/shared/contexts/auth-context';
import ReactQueryProvider from '@/shared/providers/query-provider';
import { getServerSession } from '@/shared/services/server/auth-server-service';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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
  description: 'Office management system for NCC QN',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get session data server-side
  const session = await getServerSession();

  const initialAuthState: {
    user: any;
    isAuthenticated: boolean;
  } = {
    user: null,
    isAuthenticated: false,
  };

  // Check if user has valid session
  if (session.tokens?.accessToken && session.user) {
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
