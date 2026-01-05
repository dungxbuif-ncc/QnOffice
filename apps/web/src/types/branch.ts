export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBranchDto {
  name: string;
  code: string;
  address?: string;
}

export interface UpdateBranchDto {
  name?: string;
  code?: string;
  address?: string;
}
