import { PenaltyStatus } from '../enums/penalty.enum';
import { Staff } from './staff.types';

export interface Penalty {
  id: number;
  staffId: number;
  penaltyTypeId: number;
  date: string | Date;
  amount: number;
  reason: string;
  evidenceUrls: string[];
  status: PenaltyStatus;
  penaltyType?: PenaltyType;
  staff?: Staff;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PenaltyType {
  id: number;
  name: string;
  description: string;
  amount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ICreatePenaltyDto {
  staffId: number;
  penaltyTypeId: number;
  date: string;
  amount?: number;
  reason: string;
  evidenceUrls?: string[];
}

export interface IUpdatePenaltyDto {
  staffId?: number;
  penaltyTypeId?: number;
  date?: string;
  amount?: number;
  reason?: string;
  evidenceUrls?: string[];
  status?: PenaltyStatus;
}

export interface IUpdatePenaltyEvidenceDto {
  evidenceUrls: string[];
  reason?: string;
}

export interface ICreatePenaltyTypeDto {
  name: string;
  description?: string;
  amount: number;
}

export interface IUpdatePenaltyTypeDto {
  name?: string;
  description?: string;
  amount?: number;
}

export interface PenaltyTotalResponse {
  total: number;
  unpaid: number;
}
