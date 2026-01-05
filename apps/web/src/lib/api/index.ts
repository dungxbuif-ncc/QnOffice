import { ApiConfig } from './base-api';
import { BranchApiService } from './branch-api';

const API_CONFIG: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
};

export const branchApi = new BranchApiService(API_CONFIG);

export { ApiError } from './base-api';
export type { ApiConfig } from './base-api';
