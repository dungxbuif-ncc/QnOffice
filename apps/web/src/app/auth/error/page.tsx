'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('message') || 'Authentication failed';

  useEffect(() => {
    console.error('Auth error:', errorMessage);
  }, [errorMessage]);

  const handleRetry = () => {
    router.push('/auth/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-600">
            Authentication Error
          </CardTitle>
          <CardDescription>
            There was a problem with your login attempt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>

          <div className="space-y-2">
            <Button onClick={handleRetry} className="w-full">
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
