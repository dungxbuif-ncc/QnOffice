import {
  getServerPaginationParams,
  SearchParams,
} from '@/shared/lib/base-paginated-service';
import { penaltyServerService } from '@/shared/lib/server/penalty-server-service';
import { PenaltiesPageClient } from './page-client';

interface PenaltiesPageProps {
  searchParams?: SearchParams;
}

export default async function PenaltiesPage({
  searchParams,
}: PenaltiesPageProps) {
  const resolvedSearchParams = await searchParams;

  const params = getServerPaginationParams(resolvedSearchParams || {}, {
    defaultPage: 1,
    defaultPageSize: 10,
    defaultOrder: 'DESC',
  });

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
