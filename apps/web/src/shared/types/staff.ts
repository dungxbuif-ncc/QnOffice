import { UserRole } from '@qnoffice/shared';

export enum StaffStatus {
  ACTIVE = 0,
  ON_LEAVE = 1,
  LEAVED = 2,
}

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

export interface GetStaffParams {
  page?: number;
  take?: number;
  order?: 'ASC' | 'DESC';
  q?: string;
}
