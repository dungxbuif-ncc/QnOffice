import {
  ApiResponse,
  Branch,
  CreateBranchDto,
  PaginatedResponse,
  PaginationOptions,
  UpdateBranchDto,
} from '@/types';
import { ApiConfig, BaseApiService } from './base-api';

export class BranchApiService extends BaseApiService {
  constructor(config: ApiConfig) {
    super(config);
  }

  async getBranches(
    options: PaginationOptions = {},
  ): Promise<PaginatedResponse<Branch>> {
    const query = this.buildPaginationQuery(options);
    const response = await this.get<{
      result: Branch[];
      page: number;
      pageSize: number;
      total: number;
    }>(`/branches${query}`);

    return {
      ...response,
      data: response.data.result,
      meta: {
        page: response.data.page,
        pageSize: response.data.pageSize,
        total: response.data.total,
      },
    };
  }

  async getBranch(id: number): Promise<ApiResponse<Branch>> {
    return this.get<Branch>(`/branches/${id}`);
  }

  async createBranch(data: CreateBranchDto): Promise<ApiResponse<Branch>> {
    return this.post<Branch>('/branches', data);
  }

  async updateBranch(
    id: number,
    data: UpdateBranchDto,
  ): Promise<ApiResponse<Branch>> {
    return this.put<Branch>(`/branches/${id}`, data);
  }

  async deleteBranch(id: number): Promise<ApiResponse<void>> {
    return this.delete<void>(`/branches/${id}`);
  }
}
