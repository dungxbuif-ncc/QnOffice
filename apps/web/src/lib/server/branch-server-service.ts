import { BaseServerService } from './base-server-service';

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  phone?: string;
  email?: string;
  managerId?: number;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BranchCreateData {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: number;
  isActive?: boolean;
}
export interface BranchUpdateData extends Partial<BranchCreateData> {}

export interface PaginatedBranches {
  data: Branch[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface GetBranchesParams {
  page?: number;
  take?: number;
  order?: 'ASC' | 'DESC';
  q?: string;
}

export class BranchServerService extends BaseServerService {
  private readonly baseUrl = '/branches';

  async getAll(params: GetBranchesParams = {}): Promise<PaginatedBranches> {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined)
      searchParams.set('page', params.page.toString());
    if (params.take !== undefined)
      searchParams.set('take', params.take.toString());
    if (params.order) searchParams.set('order', params.order);
    if (params.q) searchParams.set('q', params.q);

    const url = `${this.baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.get<PaginatedBranches>(url);
  }

  async getById(id: number): Promise<Branch> {
    return this.get<Branch>(`${this.baseUrl}/${id}`);
  }

  async create(data: BranchCreateData): Promise<Branch> {
    return this.post<Branch>(this.baseUrl, data);
  }

  async update(id: number, data: BranchUpdateData): Promise<Branch> {
    return this.put<Branch>(`${this.baseUrl}/${id}`, data);
  }

  async remove(id: number): Promise<void> {
    return this.delete(`${this.baseUrl}/${id}`);
  }
}

export const branchServerService = new BranchServerService();
