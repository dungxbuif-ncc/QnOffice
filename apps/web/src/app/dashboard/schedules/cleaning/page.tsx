import { CleaningPageClient } from '@/app/dashboard/schedules/cleaning/page-client';
import { cleaningServerService } from '@/shared/services/server/cleaning-server-service';
import { ScheduleCycle } from '@qnoffice/shared';

export default async function CleaningPage() {
  let cycles: ScheduleCycle[] = [];
  let error: string | null = null;

  try {
    const cyclesData = await cleaningServerService.getCycles();

    cycles = Array.isArray(cyclesData) ? cyclesData : [];
  } catch (err) {
    console.error('Failed to load cleaning data:', err);
    error = 'Failed to load cleaning data';
  }

  return <CleaningPageClient cycles={cycles} error={error} />;
}
