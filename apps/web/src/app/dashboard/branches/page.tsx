import { BranchesDataTable } from '@/components/branches/branches-data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getServerPaginationParams,
  SearchParams,
} from '@/shared/lib/base-paginated-service';
import { branchServerService } from '@/shared/services/server/branch-server-service';

interface BranchesPageProps {
  searchParams?: SearchParams;
}

export default async function BranchesPage({
  searchParams,
}: BranchesPageProps) {
  const resolvedSearchParams = await searchParams;

  const params = getServerPaginationParams(resolvedSearchParams || {}, {
    defaultPage: 1,
    defaultPageSize: 10,
    defaultOrder: 'DESC',
  });

  const branchesResponse = await branchServerService.getAll(params);
  const branches = branchesResponse?.result || [];
  const pagination = {
    page: branchesResponse?.page || 1,
    pageSize: branchesResponse?.pageSize || 10,
    total: branchesResponse?.total || 0,
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Branches</CardTitle>
        </CardHeader>
        <CardContent>
          <BranchesDataTable
            initialData={branches}
            initialPagination={pagination}
          />
        </CardContent>
      </Card>
    </div>
  );
}
