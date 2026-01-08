import { penaltyServerService } from '@/shared/services/server/penalty-server-service';
import { SearchOrder, SearchParams } from '@qnoffice/shared';
import { PenaltiesPageClient } from './page-client';

interface PenaltiesPageProps {
  searchParams?: SearchParams;
}

export default async function PenaltiesPage({
  searchParams,
}: PenaltiesPageProps) {
  const resolvedSearchParams = await searchParams;

  const params = {
    page: resolvedSearchParams?.page
      ? parseInt(String(resolvedSearchParams.page))
      : 1,
    take: resolvedSearchParams?.take
      ? parseInt(String(resolvedSearchParams.take))
      : 10,
    order: (resolvedSearchParams?.order as SearchOrder) || SearchOrder.DESC,
  };

  const penaltiesResponse = await penaltyServerService.getAll(params);

  const penalties = penaltiesResponse?.result || [];
  const pagination = {
    page: penaltiesResponse?.page || 1,
    pageSize: penaltiesResponse?.pageSize || 10,
    total: penaltiesResponse?.total || 0,
  };

  return (
    <PenaltiesPageClient
      initialData={penalties}
      initialPagination={pagination}
    />
  );
}
