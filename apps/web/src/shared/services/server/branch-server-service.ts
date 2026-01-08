import {
  ApiResponse,
  Branch,
  CreateBranchDto,
  IPaginationDto,
  UpdateBranchDto,
} from '@qnoffice/shared';
import { BaseServerService } from './base-server-service';

export interface GetBranchesParams {
  page?: number;
  take?: number;
  order?: 'ASC' | 'DESC';
  q?: string;
}

export class BranchServerService extends BaseServerService {
  private readonly baseUrl = '/branches';

  async getAll(
    params: GetBranchesParams = {},
  ): Promise<IPaginationDto<Branch>> {
    try {
      const searchParams = new URLSearchParams();

      if (params.page !== undefined)
        searchParams.set('page', params.page.toString());
      if (params.take !== undefined)
        searchParams.set('take', params.take.toString());
      if (params.order) searchParams.set('order', params.order);
      if (params.q) searchParams.set('q', params.q);

      const url = `${this.baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await this.get<IPaginationDto<Branch>>(url);
      return response?.data;
    } catch (error) {
      console.error('Error in getAll branches:', error);
      return {
        page: 1,
        pageSize: 10,
        total: 0,
        result: [],
      };
    }
  }

  async getById(id: number): Promise<ApiResponse<Branch>> {
    return this.get<Branch>(`${this.baseUrl}/${id}`);
  }

  async create(data: CreateBranchDto): Promise<ApiResponse<Branch>> {
    return this.post<Branch>(this.baseUrl, data);
  }

  async update(
    id: number,
    data: UpdateBranchDto,
  ): Promise<ApiResponse<Branch>> {
    return this.put<Branch>(`${this.baseUrl}/${id}`, data);
  }

  async remove(id: number): Promise<ApiResponse<void>> {
    return this.delete(`${this.baseUrl}/${id}`);
  }
}

export const branchServerService = new BranchServerService();
