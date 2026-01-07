'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/shared/contexts/auth-context';

interface LoginComponentProps {
  className?: string;
}

export function LoginComponent({ className }: LoginComponentProps) {
  const { login } = useAuth();

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-gray-100 ${className}`}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            QN Office Management
          </CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={login} className="w-full" size="lg">
            Login with Mezon
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
