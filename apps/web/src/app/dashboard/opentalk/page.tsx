import { opentalkServerService } from '@/shared/services/server/opentalk-server-service';
import { OpentalkPageClient } from './page-client';

export default async function OpentalkPage() {
  const error: string | null = null;
  const cyclesData = await opentalkServerService.getCycles();

  return <OpentalkPageClient cycles={cyclesData?.data ?? []} error={error} />;
}
