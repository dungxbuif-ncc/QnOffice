import { PenaltyStatus } from '@qnoffice/shared';

export interface PenaltyType {
  id: number;
  name: string;
  description?: string;
  amount: number;
  created_at: Date;
  updated_at: Date;
}

export interface Campaign {
  id: number;
  name: string;
  start_date: Date;
  end_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Penalty {
  id: number;
  user_id: number;
  penalty_type_id: number;
  penaltyType?: PenaltyType;
  campaign_id?: number;
  campaign?: Campaign;
  date: Date;
  amount: number;
  reason: string;
  evidence_urls?: string[];
  status: PenaltyStatus;
  created_by: number;
  created_at: Date;
  updated_at: Date;
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

export interface PenaltyTotalResponse {
  total: number;
  unpaid: number;
}
