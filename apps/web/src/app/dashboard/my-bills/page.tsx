import { billingServerService } from '@/shared/services/server/billing-server-service';
import { BillingsPageClient } from './page-client';

export default async function BillingsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const billings = await billingServerService.getMyBillings(month);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Chi tiêu</h1>
      </div>

      <BillingsPageClient billings={billings} initialMonth={month} />
    </div>
  );
}
