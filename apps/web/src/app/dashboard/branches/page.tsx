'use client';

import { createBranchColumns } from '@/components/branches/branch-columns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { useBranches, useDeleteBranch } from '@/hooks/use-branches';
import { Branch, PaginationOptions } from '@/types';
import { useState } from 'react';
import { toast } from 'sonner';

export default function BranchesPage() {
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: 1,
    pageSize: 10,
    sortOrder: 'DESC',
  });

  const { data: branchesResponse, isLoading, error } = useBranches(pagination);
  const deleteBranchMutation = useDeleteBranch();

  const branches = branchesResponse?.data || [];
  const meta = branchesResponse?.meta;

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }));
  };

  const handleEdit = (branch: Branch) => {
    // TODO: Open edit modal/form
    console.log('Edit branch:', branch);
    toast.info('Edit functionality coming soon');
  };

  const handleView = (branch: Branch) => {
    // TODO: Open view modal/details page
    console.log('View branch:', branch);
    toast.success(`Viewing details for "${branch.name}"`);
  };

  const handleDelete = async (id: number, name: string) => {
    toast.info('Delete functionality disabled for now');
  };

  const handleAddNew = () => {
    toast.info('Add new branch functionality coming soon');
  };
  const columns = createBranchColumns(handleEdit, handleDelete, handleView);

  if (error) {
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

  return (
    <div className="space-y-6">
      {/* <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Branches</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all office branches and their information
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Branch
        </Button>
      </div> */}

      <Card>
        <CardHeader>
          <CardTitle>All Branches</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={branches}
            searchKey="name"
            searchPlaceholder="Search branches..."
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pagination={{
              page: pagination.page || 1,
              pageSize: pagination.pageSize || 10,
              total: meta?.total || 0,
            }}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
