import {
  PaginationParams,
  SearchParams,
  UsePaginationOptions,
} from '@qnoffice/shared';

// Re-export pagination types from shared library
export type {
  IPaginateOptionsDto,
  IPaginationDto,
  PaginationParams,
  PaginationResponse,
  PaginationState,
  SearchOrder,
  SearchParams,
  UsePaginationOptions,
  UsePaginationReturn,
} from '@qnoffice/shared';

// Helper function to parse search params to pagination params
export const parseSearchParams = (
  searchParams: SearchParams,
  defaults: UsePaginationOptions = {},
): PaginationParams => {
  return {
    page: searchParams?.page
      ? parseInt(searchParams.page)
      : defaults.defaultPage || 1,
    take: searchParams?.take
      ? parseInt(searchParams.take)
      : defaults.defaultPageSize || 10,
    order:
      (searchParams?.order as 'ASC' | 'DESC') ||
      defaults.defaultOrder ||
      'DESC',
    q: searchParams?.q,
  };
};

// Helper function to build URL search params
export const buildSearchParams = (params: PaginationParams): string => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.take) searchParams.set('take', params.take.toString());
  if (params.order) searchParams.set('order', params.order);
  if (params.q) searchParams.set('q', params.q);

  return searchParams.toString();
};
