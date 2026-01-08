export interface Branch {
  id: number;
  name: string;
  code: string;
  address?: string;
  created_at: string;
  updated_at: string;
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
