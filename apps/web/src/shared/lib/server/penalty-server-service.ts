import { PaginationResponse } from '@/shared/types';
import {
  Penalty,
  PenaltyTotalResponse,
  PenaltyType,
} from '@/shared/types/penalty';
import { BaseServerService } from './base-server-service';

export class PenaltyServerService extends BaseServerService {
  async getAll(params?: {
    page?: number;
    take?: number;
    order?: string;
  }): Promise<PaginationResponse<Penalty>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.take) queryParams.append('take', params.take.toString());
    if (params?.order) queryParams.append('order', params.order);

    const endpoint = `/penalties${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response =
      await this.makeRequest<PaginationResponse<Penalty>>(endpoint);
    return response.data || { result: [], page: 1, pageSize: 10, total: 0 };
  }

  async getMyPenalties(params?: {
    page?: number;
    take?: number;
    order?: string;
  }): Promise<PaginationResponse<Penalty>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.take) queryParams.append('take', params.take.toString());
    if (params?.order) queryParams.append('order', params.order);

    const endpoint = `/penalties/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response =
      await this.makeRequest<PaginationResponse<Penalty>>(endpoint);
    return response.data || { result: [], page: 1, pageSize: 10, total: 0 };
  }

  async getMyPenaltyTotal(): Promise<PenaltyTotalResponse> {
    const response = await this.makeRequest<PenaltyTotalResponse>(
      '/penalties/my/total',
    );
    return response.data || { total: 0, unpaid: 0 };
  }

  async getPenaltyTypes(): Promise<PenaltyType[]> {
    const response = await this.makeRequest<PenaltyType[]>('/penalty-types');
    return response.data || [];
  }
}

export const penaltyServerService = new PenaltyServerService();
