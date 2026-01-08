import { PenaltyStatus } from '../enums/penalty.enum';

export interface Penalty {
  id: number;
  user_id: number;
  penalty_type_id: number;
  date: string;
  amount: number;
  reason: string;
  evidence_urls: string[];
  status: PenaltyStatus;
  campaign_id?: number;
  created_at: string;
  updated_at: string;
}

export interface PenaltyType {
  id: number;
  name: string;
  description: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePenaltyDto {
  user_id: number;
  penalty_type_id: number;
  date: string;
  amount?: number;
  reason: string;
  evidence_urls?: string[];
  campaign_id?: number;
}

export interface UpdatePenaltyDto {
  user_id?: number;
  penalty_type_id?: number;
  date?: string;
  amount?: number;
  reason?: string;
  evidence_urls?: string[];
  campaign_id?: number;
  status?: PenaltyStatus;
}

export interface UpdatePenaltyEvidenceDto {
  evidence_urls: string[];
  reason?: string;
}

export interface CreatePenaltyTypeDto {
  name: string;
  description?: string;
  amount: number;
}

export interface UpdatePenaltyTypeDto {
  name?: string;
  description?: string;
  amount?: number;
}
