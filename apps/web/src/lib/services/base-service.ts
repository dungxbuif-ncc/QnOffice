export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class ApiError extends Error {
  status: number;
  response: any;

  constructor(message: string, status: number, response?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

import { PATHS } from '@/constants/paths';

export abstract class BaseService {
  protected baseURL = PATHS.API.BASE;

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
          // Handle backend error format: { statusCode, data, errors, message }
          const errorMessage =
            errorData.errors?.message ||
            errorData.message ||
            `HTTP ${response.status}`;
          throw new ApiError(errorMessage, response.status, errorData);
        } catch (parseError) {
          if (parseError instanceof ApiError) throw parseError;
          throw new ApiError(
            response.statusText || `HTTP ${response.status}`,
            response.status,
            null,
          );
        }
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      const jsonResponse = await response.json();

      // Handle backend response format: { statusCode, data, message }
      // Return the data property if it exists, otherwise return the full response
      return jsonResponse.data !== undefined ? jsonResponse.data : jsonResponse;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or parsing errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        error,
      );
    }
  }

  protected async get<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.pathname + url.search);
  }

  protected async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  protected async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}
