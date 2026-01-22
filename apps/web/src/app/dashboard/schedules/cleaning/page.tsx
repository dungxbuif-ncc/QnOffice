import { cleaningServerService } from '@/shared/services/server/cleaning-server-service';
import { CleaningPageClient } from './page-client';

interface CleaningPageProps {
  searchParams?: Promise<{
    status?: string;
    email?: string;
  }>;
}

export default async function CleaningPage({
  searchParams,
}: CleaningPageProps) {
  const resolvedSearchParams = await searchParams;

  const status = resolvedSearchParams?.status;
  const email = resolvedSearchParams?.email;

  const cycles = await cleaningServerService.getCycles(status, email);

  return <CleaningPageClient cycles={cycles} />;
}
