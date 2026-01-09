import { OpentalkPageClient } from '@/components/opentalk/page-client';
import { opentalkServerService } from '@/shared/services/server/opentalk-server-service';

export default async function OpentalkPage() {
  const error: string | null = null;
  const cyclesData = await opentalkServerService.getCycles();
  return <OpentalkPageClient cycles={cyclesData ?? []} error={error} />;
}
