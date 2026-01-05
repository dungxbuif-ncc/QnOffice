import { BranchesDataTable } from '@/components/branches/branches-data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  branchServerService,
  GetBranchesParams,
} from '@/lib/server/branch-server-service';

interface BranchesPageProps {
  searchParams?: {
    page?: string;
    take?: string;
    order?: 'ASC' | 'DESC';
    q?: string;
  };
}

export default async function BranchesPage({
  searchParams,
}: BranchesPageProps) {
  const resolvedSearchParams = await searchParams;

  const params: GetBranchesParams = {
    page: resolvedSearchParams?.page ? parseInt(resolvedSearchParams.page) : 1,
    take: resolvedSearchParams?.take ? parseInt(resolvedSearchParams.take) : 10,
    order: (resolvedSearchParams?.order as 'ASC' | 'DESC') || 'DESC',
    q: resolvedSearchParams?.q,
  };

  try {
    const branchesResponse = await branchServerService.getAll(params);
    console.log(
      '[BranchesPage] Raw response:',
      JSON.stringify(branchesResponse, null, 2),
    );

    const branches = branchesResponse.data || [];
    const meta = branchesResponse.meta;

    console.log('[BranchesPage] Extracted branches:', branches.length, 'items');
    console.log('[BranchesPage] Meta:', meta);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>All Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <BranchesDataTable
              initialData={branches}
              initialPagination={{
                page: params.page || 1,
                pageSize: params.take || 10,
                total: meta?.totalItems || 0,
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Failed to fetch branches:', error);

    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">
            Error loading branches
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
        </div>
      </div>
    );
  }
}
