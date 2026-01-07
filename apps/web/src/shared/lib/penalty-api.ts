import { ApiResponse, SearchOrder } from '@qnoffice/shared';
import { PaginationResponse } from './api';
import {
  CreatePenaltyDto,
  CreatePenaltyTypeDto,
  Penalty,
  PenaltyTotalResponse,
  PenaltyType,
  UpdatePenaltyDto,
  UpdatePenaltyEvidenceDto,
  UpdatePenaltyTypeDto,
} from './penalty';

const API_BASE_URL = '/api';

// Penalty Type API
export async function getPenaltyTypes(): Promise<PenaltyType[]> {
  const response = await fetch(
    `${API_BASE_URL}/penalty-types?page=1&take=100`,
    {
      credentials: 'include',
    },
  );
  if (!response.ok) throw new Error('Failed to fetch penalty types');
  const apiResponse: ApiResponse<{ result: PenaltyType[]; total: number }> =
    await response.json();
  return apiResponse.data.result;
}

export async function createPenaltyType(
  data: CreatePenaltyTypeDto,
): Promise<PenaltyType> {
  const response = await fetch(`${API_BASE_URL}/penalty-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create penalty type');
  const apiResponse: ApiResponse<PenaltyType> = await response.json();
  return apiResponse.data;
}

export async function updatePenaltyType(
  id: number,
  data: UpdatePenaltyTypeDto,
): Promise<PenaltyType> {
  const response = await fetch(`${API_BASE_URL}/penalty-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update penalty type');
  const apiResponse: ApiResponse<PenaltyType> = await response.json();
  return apiResponse.data;
}

export async function deletePenaltyType(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/penalty-types/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete penalty type');
}

// Penalty API
export async function getPenalties(params?: {
  page?: number;
  take?: number;
  order?: SearchOrder;
  userId?: number;
  campaignId?: number;
  status?: string;
}): Promise<PaginationResponse<Penalty>> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.take) queryParams.append('take', params.take.toString());
  if (params?.order) queryParams.append('order', params.order);
  if (params?.userId) queryParams.append('userId', params.userId.toString());
  if (params?.campaignId)
    queryParams.append('campaignId', params.campaignId.toString());
  if (params?.status) queryParams.append('status', params.status);

  const response = await fetch(
    `${API_BASE_URL}/penalties?${queryParams.toString()}`,
    {
      credentials: 'include',
    },
  );
  if (!response.ok) throw new Error('Failed to fetch penalties');
  const apiResponse: ApiResponse<PaginationResponse<Penalty>> =
    await response.json();
  return apiResponse.data;
}

export async function getMyPenalties(): Promise<Penalty[]> {
  const response = await fetch(`${API_BASE_URL}/penalties/my`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch my penalties');
  const apiResponse: ApiResponse<Penalty[]> = await response.json();
  return apiResponse.data;
}

export async function getMyPenaltyTotal(): Promise<PenaltyTotalResponse> {
  const response = await fetch(`${API_BASE_URL}/penalties/my/total`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch penalty total');
  const apiResponse: ApiResponse<PenaltyTotalResponse> = await response.json();
  return apiResponse.data;
}

export async function createPenalty(data: CreatePenaltyDto): Promise<Penalty> {
  const response = await fetch(`${API_BASE_URL}/penalties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create penalty');
  const apiResponse: ApiResponse<Penalty> = await response.json();
  return apiResponse.data;
}

export async function updatePenalty(
  id: number,
  data: UpdatePenaltyDto,
): Promise<Penalty> {
  const response = await fetch(`${API_BASE_URL}/penalties/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update penalty');
  const apiResponse: ApiResponse<Penalty> = await response.json();
  return apiResponse.data;
}

export async function updatePenaltyEvidence(
  id: number,
  data: UpdatePenaltyEvidenceDto,
): Promise<Penalty> {
  const response = await fetch(`${API_BASE_URL}/penalties/${id}/evidence`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update penalty evidence');
  const apiResponse: ApiResponse<Penalty> = await response.json();
  return apiResponse.data;
}

export async function deletePenalty(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/penalties/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete penalty');
}
