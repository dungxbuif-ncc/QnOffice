import { PaginatedPantryTransactionResponse } from '@qnoffice/shared';
import { BaseServerService } from './base-server-service';

export class PantryTransactionServerService extends BaseServerService {
  async getTransactions(
    page: number = 1,
    limit: number = 10,
    startTime?: string,
    endTime?: string,
  ): Promise<PaginatedPantryTransactionResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (startTime) params.append('start_time', startTime);
    if (endTime) params.append('end_time', endTime);

    const response = await this.makeRequest<any>(
      `/pantry-transactions?${params.toString()}`,
    );
    
    // Backend returns AppPaginationDto via ApiResponse
    // ApiResponse<AppPaginationDto> = { statusCode, data: AppPaginationDto }
    // AppPaginationDto = { page, pageSize, total, result: [...] }
    const appPagination = (response as any)?.data;
    
    // Convert AppPaginationDto to PaginatedPantryTransactionResponse
    if (appPagination && typeof appPagination === 'object' && 'result' in appPagination) {
      return {
        data: appPagination.result || [],
        meta: {
          page: appPagination.page || 1,
          limit: appPagination.pageSize || 10,
          total: appPagination.total || 0,
          totalPages: Math.ceil((appPagination.total || 0) / (appPagination.pageSize || 10)),
        },
      };
    }
    
    // Fallback
    return { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }

  async getStats(
    startTime?: string,
    endTime?: string,
  ): Promise<{
    totalTransactions: number;
    totalAmount: number;
    uniqueContributors: number;
  }> {
    const params = new URLSearchParams();
    if (startTime) params.append('start_time', startTime);
    if (endTime) params.append('end_time', endTime);

    const response = await this.makeRequest<{
      totalTransactions: number;
      totalAmount: number;
      uniqueContributors: number;
    }>(`/pantry-transactions/stats?${params.toString()}`);
    return (
      response.data || {
        totalTransactions: 0,
        totalAmount: 0,
        uniqueContributors: 0,
      }
    );
  }
}

export const pantryTransactionServerService =
  new PantryTransactionServerService();
