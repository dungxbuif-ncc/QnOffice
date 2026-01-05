'use client';

import { createBranchColumns } from '@/components/branches/branch-columns';
import { DataTable } from '@/components/ui/data-table';
import { Branch } from '@/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface BranchesClientWrapperProps {
  initialData: Branch[];
  initialPagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export function BranchesClientWrapper({
  initialData,
  initialPagination,
}: BranchesClientWrapperProps) {
  const router = useRouter();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page.toString());
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handlePageSizeChange = (pageSize: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('pageSize', pageSize.toString());
    params.set('page', '1'); // Reset to first page when changing page size
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handleEdit = (branch: Branch) => {
    // TODO: Open edit modal/form
    console.log('Edit branch:', branch);
    toast.info('Edit functionality coming soon');
  };

  const handleView = (branch: Branch) => {
    console.log('View branch:', branch);
    toast.success(`Viewing details for "${branch.name}"`);
  };

  const handleDelete = async (id: number, name: string) => {
    toast.info('Delete functionality disabled for now');
  };

  const columns = createBranchColumns(handleEdit, handleDelete, handleView);

  return (
    <DataTable
      columns={columns}
      data={initialData}
      searchKey="name"
      searchPlaceholder="Search branches..."
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      pagination={initialPagination}
      isLoading={false} // Data is already loaded on server
    />
  );
}
