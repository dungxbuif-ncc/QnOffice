import { PATHS } from '@/constants/paths';
import { PaginationOptions } from '../../types/api';
import { Branch, CreateBranchDto, UpdateBranchDto } from '../../types/branch';
import { BaseService, PaginatedResponse } from './base-service';

export class BranchService extends BaseService {
  private endpoint = PATHS.API.BRANCHES;

  async getAll(
    options: PaginationOptions = {},
  ): Promise<PaginatedResponse<Branch>> {
    return this.get<PaginatedResponse<Branch>>(this.endpoint, options);
  }

  async getById(id: string): Promise<Branch> {
    return this.get<Branch>(`${this.endpoint}/${id}`);
  }

  async create(data: CreateBranchDto): Promise<Branch> {
    return this.post<Branch>(this.endpoint, data);
  }

  async update(id: string, data: UpdateBranchDto): Promise<Branch> {
    return this.put<Branch>(`${this.endpoint}/${id}`, data);
  }

  async remove(id: string): Promise<void> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }
}

export const branchService = new BranchService();
