import { SearchOrder } from '../enums/search-order.enum';

export interface IPaginationDto<T> {
  page: number;
  pageSize: number;
  total: number;
  result: T[];
}

export interface IPaginateOptionsDto {
  order: SearchOrder;
  page: number;
  take: number;
  q?: string;
  skip: number;
}

// Type aliases for frontend compatibility
export type PaginationParams = Omit<IPaginateOptionsDto, 'skip'>;
export type PaginationResponse<T> = IPaginationDto<T>;

export interface SearchParams {
  page?: number;
  take?: number;
  order?: SearchOrder;
  q?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface UsePaginationOptions {
  defaultPage?: number;
  defaultPageSize?: number;
  defaultOrder?: SearchOrder;
}

export interface UsePaginationReturn {
  isLoading: boolean;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (pageSize: number) => void;
  handleSearch: (query: string) => void;
  handleOrderChange: (order: SearchOrder) => void;
  currentPage: number;
  currentPageSize: number;
  currentOrder: SearchOrder;
  currentQuery: string;
}
