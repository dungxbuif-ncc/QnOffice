import axios from 'axios';
import { ApiConfig } from './api/base-api';
import { BranchApiService } from './api/branch-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const apiConfig: ApiConfig = {
  baseURL: API_BASE_URL,
  withCredentials: true,
};

export const branchApi = new BranchApiService(apiConfig);

export default api;
