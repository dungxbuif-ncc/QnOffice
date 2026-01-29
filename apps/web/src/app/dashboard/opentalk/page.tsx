import { OpentalkPageClient } from '@/components/opentalk/page-client';
import { opentalkServerService } from '@/shared/services/server/opentalk-server-service';

interface OpentalkPageProps {
  searchParams?: Promise<{
    status?: string;
    email?: string;
  }>;
}

export default async function OpentalkPage({
  searchParams,
}: OpentalkPageProps) {
  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams?.status;
  const email = resolvedSearchParams?.email;

  const cyclesData = await opentalkServerService.getCycles(status, email);
  return <OpentalkPageClient cycles={cyclesData ?? []} />;
}
