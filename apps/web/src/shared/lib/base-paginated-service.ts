import { SearchOrder, SearchParams } from '@qnoffice/shared';

export type { SearchParams } from '@qnoffice/shared';

export interface GetServerPaginationOptions {
  defaultPage?: number;
  defaultPageSize?: number;
  defaultOrder?: SearchOrder | string;
}

export function getServerPaginationParams(
  searchParams: Record<string, string | string[] | undefined> | SearchParams,
  options: GetServerPaginationOptions = {},
): {
  page: number;
  take: number;
  order: SearchOrder;
  q?: string;
} {
  const {
    defaultPage = 1,
    defaultPageSize = 10,
    defaultOrder = SearchOrder.DESC,
  } = options;

  const page =
    typeof searchParams.page === 'string'
      ? parseInt(searchParams.page)
      : typeof searchParams.page === 'number'
        ? searchParams.page
        : defaultPage;

  const take =
    typeof searchParams.take === 'string'
      ? parseInt(searchParams.take)
      : typeof searchParams.take === 'number'
        ? searchParams.take
        : defaultPageSize;

  const orderValue =
    typeof searchParams.order === 'string'
      ? searchParams.order
      : typeof defaultOrder === 'string'
        ? defaultOrder
        : SearchOrder.DESC;

  const order: SearchOrder =
    orderValue === SearchOrder.ASC || orderValue === SearchOrder.DESC
      ? orderValue
      : SearchOrder.DESC;

  const q =
    typeof searchParams.q === 'string' && searchParams.q
      ? searchParams.q
      : undefined;

  return {
    page: isNaN(page) ? defaultPage : page,
    take: isNaN(take) ? defaultPageSize : take,
    order,
    ...(q && { q }),
  };
}
