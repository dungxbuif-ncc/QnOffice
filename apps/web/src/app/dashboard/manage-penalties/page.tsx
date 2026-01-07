import {
  getServerPaginationParams,
  SearchParams,
} from '@/shared/lib/base-paginated-service';
import { penaltyTypeServerService } from '@/shared/lib/server/penalty-type-server-service';
import { ManagePenaltiesClient } from './page-client';

interface ManagePenaltiesPageProps {
  searchParams?: SearchParams;
}

export default async function ManagePenaltiesPage({
  searchParams,
}: ManagePenaltiesPageProps) {
  const resolvedSearchParams = await searchParams;

  const params = getServerPaginationParams(resolvedSearchParams || {}, {
    defaultPage: 1,
    defaultPageSize: 10,
    defaultOrder: 'ASC',
  });

  const penaltyTypesResponse = await penaltyTypeServerService.getAll(params);

  const penaltyTypes = penaltyTypesResponse?.result || [];
  const pagination = {
    page: penaltyTypesResponse?.page || 1,
    pageSize: penaltyTypesResponse?.pageSize || 10,
    total: penaltyTypesResponse?.total || 0,
  };

  return (
    <ManagePenaltiesClient
      initialData={penaltyTypes}
      initialPagination={pagination}
    />
  );
}
