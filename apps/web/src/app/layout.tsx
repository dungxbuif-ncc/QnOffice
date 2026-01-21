import { AuthProvider } from '@/shared/contexts/auth-context';
import ReactQueryProvider from '@/shared/providers/query-provider';
import { getServerSession } from '@/shared/services/server/auth-server-service';
import type { Metadata } from 'next';
import './globals.css';


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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`antialiased font-sans`}>
        <ReactQueryProvider>
          <AuthProvider initialState={initialAuthState}>{children}</AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
