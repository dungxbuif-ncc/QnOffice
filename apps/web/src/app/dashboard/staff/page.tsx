import { StaffDataTable } from '@/components/staff/staff-data-table';
import { StaffPageActions } from '@/components/staff/staff-page-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getServerPaginationParams,
  SearchParams,
} from '@/shared/lib/base-paginated-service';
import { branchServerService } from '@/shared/lib/server/branch-server-service';
import { staffServerService } from '@/shared/lib/server/staff-server-service';

interface StaffPageProps {
  searchParams?: SearchParams;
}

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const resolvedSearchParams = await searchParams;

  const params: SearchParams = getServerPaginationParams(
    resolvedSearchParams || {},
    { defaultPage: 1, defaultPageSize: 10, defaultOrder: 'DESC' },
  );

  const [staffResponse, branchesResponse] = await Promise.all([
    staffServerService.getAll(params),
    branchServerService.getAll({ page: 1, take: 100 }),
  ]);

  const staff = staffResponse?.result || [];
  const branches = branchesResponse?.result || [];
  const pagination = {
    page: staffResponse?.page || 1,
    pageSize: staffResponse?.pageSize || 10,
    total: staffResponse?.total || 0,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Staff</CardTitle>
          <StaffPageActions branches={branches} />
        </CardHeader>
        <CardContent>
          <StaffDataTable initialData={staff} initialPagination={pagination} />
        </CardContent>
      </Card>
    </div>
  );
}
