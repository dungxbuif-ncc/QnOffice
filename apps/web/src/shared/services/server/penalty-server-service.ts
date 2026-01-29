import {
    IPaginationDto,
    Penalty,
    PenaltyTotalResponse,
    PenaltyType,
    SearchParams,
} from '@qnoffice/shared';
import { BaseServerService } from './base-server-service';

export class PenaltyServerService extends BaseServerService {
  async getAll(params?: SearchParams): Promise<IPaginationDto<Penalty>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.take) queryParams.append('take', params.take.toString());
    if (params?.order) queryParams.append('order', params.order);
    if (params?.q) queryParams.append('q', params.q);

    const endpoint = `/penalties${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.makeRequest<IPaginationDto<Penalty>>(endpoint);
    return response.data || { result: [], page: 1, pageSize: 10, total: 0 };
  }

  async getGroupedByUser(
    params?: SearchParams,
  ): Promise<IPaginationDto<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.take) queryParams.append('take', params.take.toString());
    if (params?.order) queryParams.append('order', params.order);
    if (params?.q) queryParams.append('q', params.q);

    const endpoint = `/penalties/grouped-by-user${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await this.makeRequest<IPaginationDto<any>>(endpoint);
    return response.data || { result: [], page: 1, pageSize: 10, total: 0 };
  }

  async getMyPenalties(params?: SearchParams): Promise<IPaginationDto<Penalty>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.take) queryParams.append('take', params.take.toString());
    if (params?.order) queryParams.append('order', params.order);
    if (params?.q) queryParams.append('q', params.q);

    const endpoint = `/penalties/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.makeRequest<IPaginationDto<Penalty>>(endpoint);
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
