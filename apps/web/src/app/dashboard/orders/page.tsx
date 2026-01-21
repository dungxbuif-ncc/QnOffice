import { OrderFilters } from '@/components/orders/order-filters';
import { orderServerService } from '@/shared/services/server/order-server-service';
import { OrdersPageClient } from './page-client';

interface OrdersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const resolvedParams = await searchParams;
  const startDate = resolvedParams?.startDate as string | undefined;
  const endDate = resolvedParams?.endDate as string | undefined;

  const groupedOrders = await orderServerService.getGrouped({
    startDate,
    endDate,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <OrderFilters />
      </div>

      <OrdersPageClient groupedOrders={groupedOrders} />
    </div>
  );
}
