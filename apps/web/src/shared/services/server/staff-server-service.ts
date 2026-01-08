import {
  ApiResponse,
  CreateStaffDto,
  IPaginationDto,
  Staff,
  UpdateStaffUserIdDto,
} from '@qnoffice/shared';
import { BaseServerService } from './base-server-service';

export interface GetStaffParams {
  page?: number;
  take?: number;
  order?: string;
  q?: string;
}

export class StaffServerService extends BaseServerService {
  private readonly baseUrl = '/staffs';

  async getAll(params: GetStaffParams = {}): Promise<IPaginationDto<Staff>> {
    try {
      const searchParams = new URLSearchParams();
      if (params.page !== undefined)
        searchParams.set('page', params.page.toString());
      if (params.take !== undefined)
        searchParams.set('take', params.take.toString());
      if (params.order) searchParams.set('order', params.order);
      if (params.q) searchParams.set('q', params.q);

      const url = `${this.baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await this.get<IPaginationDto<Staff>>(url);
      return response?.data;
    } catch (error) {
      console.error('Error in getAll staffs:', error);
      return {
        page: 1,
        pageSize: 10,
        total: 0,
        result: [],
      };
    }
  }

  async getById(id: number): Promise<ApiResponse<Staff>> {
    return this.get<Staff>(`${this.baseUrl}/${id}`);
  }

  async create(data: CreateStaffDto): Promise<ApiResponse<Staff>> {
    return this.post<Staff>(this.baseUrl, data);
  }

  async update(
    id: number,
    data: UpdateStaffUserIdDto,
  ): Promise<ApiResponse<Staff>> {
    return this.put<Staff>(`${this.baseUrl}/${id}`, data);
  }

  async remove(id: number): Promise<ApiResponse<void>> {
    return this.delete(`${this.baseUrl}/${id}`);
  }
}

export const staffServerService = new StaffServerService();
