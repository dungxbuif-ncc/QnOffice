import { StaffStatus, UserRole } from '@qnoffice/shared';

export interface Branch {
  id: number;
  name: string;
  code: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  mezonId: string;
  name?: string;
  email?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff {
  id: number;
  email: string;
  status: StaffStatus;
  userId: string;
  branchId: number;
  user: User;
  role: UserRole | null;
  branch: Branch;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffCreateData {
  status?: StaffStatus;
  userId: string;
  branchId: number;
}

export type StaffUpdateData = Partial<StaffCreateData>;
