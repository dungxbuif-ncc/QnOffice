import { redirect } from 'next/navigation';

interface CallbackPageProps {
  searchParams: Promise<{
    code?: string;
    state?: string;
    error?: string;
  }>;
}

export default async function AuthCallbackPage({
  searchParams,
}: CallbackPageProps) {
  const params = await searchParams;

  // Build the redirect URL with all search parameters
  const searchParamsObj = new URLSearchParams();

  if (params.code) searchParamsObj.set('code', params.code);
  if (params.state) searchParamsObj.set('state', params.state);
  if (params.error) searchParamsObj.set('error', params.error);

  // Redirect to the API route handler which can modify cookies
  redirect(`/api/auth/callback?${searchParamsObj.toString()}`);
}
