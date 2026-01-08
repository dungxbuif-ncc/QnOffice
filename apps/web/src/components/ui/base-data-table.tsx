'use client';

import { DataTable } from '@/components/ui/data-table';
import { PaginationState, UsePaginationReturn } from '@qnoffice/shared';
import { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';

interface BaseDataTableProps<TData> {
  columns: ColumnDef<TData>[];
  initialData: TData[];
  initialPagination: PaginationState;
  pagination: UsePaginationReturn;
  searchKey?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showColumnFilter?: boolean;
  onRowAction?: (row: TData) => void;
  maxHeight?: string;
}

export function BaseDataTable<TData>({
  columns,
  initialData,
  initialPagination,
  pagination,
  searchKey = '',
  searchPlaceholder = 'Search...',
  showSearch = true,
  showColumnFilter = false,
  maxHeight = '500px',
}: BaseDataTableProps<TData>) {
  const [data, setData] = useState<TData[]>(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!showSearch) return;

    const timeoutId = setTimeout(() => {
      const searchValue = pagination.currentQuery;
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [pagination.currentQuery, showSearch]);

  return (
    <DataTable
      columns={columns}
      data={data}
      pagination={initialPagination}
      onPageChange={pagination.handlePageChange}
      onPageSizeChange={pagination.handlePageSizeChange}
      isLoading={pagination.isLoading}
      searchKey={searchKey}
      searchPlaceholder={searchPlaceholder}
      showColumnFilter={showColumnFilter}
      maxHeight={maxHeight}
    />
  );
}
