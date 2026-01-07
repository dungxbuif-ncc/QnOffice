import { PaginationResponse } from '@/shared/types';
import { PenaltyType } from '@/shared/types/penalty';
import { BaseServerService } from './base-server-service';

export class PenaltyTypeServerService extends BaseServerService {
  async getAll(params?: {
    page?: number;
    take?: number;
    order?: string;
  }): Promise<PaginationResponse<PenaltyType>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.take) queryParams.append('take', params.take.toString());
    if (params?.order) queryParams.append('order', params.order);

    const endpoint = `/penalty-types${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response =
      await this.makeRequest<PaginationResponse<PenaltyType>>(endpoint);
    return response.data || { result: [], page: 1, pageSize: 10, total: 0 };
  }
}

export const penaltyTypeServerService = new PenaltyTypeServerService();
