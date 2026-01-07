'use client';

import {
  PaginationParams,
  SearchOrder,
  UsePaginationOptions,
  UsePaginationReturn,
} from '@qnoffice/shared';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Custom hook for managing pagination state and URL synchronization
 *
 * @param options Configuration options for pagination defaults
 * @returns Object containing pagination state and handlers
 */
export function usePagination(
  options: UsePaginationOptions = {},
): UsePaginationReturn {
  const {
    defaultPage = 1,
    defaultPageSize = 10,
    defaultOrder = SearchOrder.DESC,
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);

  // Get current values from URL
  const currentPage = parseInt(searchParams.get('page') || '') || defaultPage;
  const currentPageSize =
    parseInt(searchParams.get('take') || '') || defaultPageSize;
  const currentOrder =
    (searchParams.get('order') as 'ASC' | 'DESC') || defaultOrder;
  const currentQuery = searchParams.get('q') || '';

  // Update URL with new parameters
  const updateURL = (newParams: Partial<PaginationParams>) => {
    setIsLoading(true);
    const params = new URLSearchParams(window.location.search);

    // Update or set parameters
    if (newParams.page !== undefined) {
      params.set('page', newParams.page.toString());
    }
    if (newParams.take !== undefined) {
      params.set('take', newParams.take.toString());
    }
    if (newParams.order !== undefined) {
      params.set('order', newParams.order);
    }
    if (newParams.q !== undefined) {
      if (newParams.q) {
        params.set('q', newParams.q);
      } else {
        params.delete('q');
      }
    }

    // Ensure required parameters are present
    if (!params.has('page')) {
      params.set('page', currentPage.toString());
    }
    if (!params.has('take')) {
      params.set('take', currentPageSize.toString());
    }

    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  // Initialize URL parameters if missing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let shouldUpdate = false;

    if (!params.has('page')) {
      params.set('page', defaultPage.toString());
      shouldUpdate = true;
    }
    if (!params.has('take')) {
      params.set('take', defaultPageSize.toString());
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      router.replace(`${window.location.pathname}?${params.toString()}`);
    }
  }, [defaultPage, defaultPageSize, router]);

  // Reset loading state when URL changes (new data arrives)
  useEffect(() => {
    setIsLoading(false);
  }, [currentPage, currentPageSize, currentOrder, currentQuery]);

  const handlePageChange = (page: number) => {
    updateURL({ page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    updateURL({ take: pageSize, page: 1 }); // Reset to first page
  };

  const handleSearch = (query: string) => {
    updateURL({ q: query, page: 1 }); // Reset to first page on search
  };

  const handleOrderChange = (order: 'ASC' | 'DESC') => {
    updateURL({ order, page: 1 }); // Reset to first page on order change
  };

  return {
    isLoading,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    handleOrderChange,
    currentPage,
    currentPageSize,
    currentOrder,
    currentQuery,
  };
}
