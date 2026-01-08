import { StaffStatus, UserRole } from '../enums';
import { Branch } from './branch.types';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: number;
  email: string;
  status: StaffStatus;
  userId: string | null;
  role: UserRole;
  branchId: number;
  user: User;
  branch: Branch;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffDto {
  email: string;
  branchId: number;
  role: UserRole;
}

export interface UpdateStaffUserIdDto {
  userId?: string | null;
}
